from decimal import Decimal
from typing import Annotated
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, File, Form, HTTPException, Security, UploadFile
from fastapi.security import HTTPBearer

from postlight.database import connection
from postlight.dependencies import current_user
from postlight.services.menu import serialize_menu_item, validate_menu_item
from postlight.services.storage import remove_image_best_effort, store_image

bearer_scheme = HTTPBearer(auto_error=False)
router = APIRouter(dependencies=[Security(bearer_scheme)])


@router.get("/menu-items")
def list_menu_items(category: str | None = None):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        if category:
            cur.execute(
                "select * from public.menu_items where category = %s order by created_at desc",
                (category,),
            )
        else:
            cur.execute("select * from public.menu_items order by created_at desc")
        return [serialize_menu_item(row) for row in cur.fetchall()]


@router.get("/menu-items/{item_id}")
def get_menu_item(item_id: UUID):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from public.menu_items where id = %s", (item_id,))
        row = cur.fetchone()
    if row is None:
        raise HTTPException(404, "Menu item not found")
    return serialize_menu_item(row)


@router.post("/menu-items", status_code=201)
async def create_menu_item(
    name: Annotated[str, Form()],
    price: Annotated[Decimal, Form()],
    user_id: Annotated[UUID, Depends(current_user)],
    description: Annotated[str, Form()] = "",
    category: Annotated[str, Form()] = "Main",
    is_available: Annotated[bool, Form()] = True,
    image: UploadFile | None = File(default=None),
):
    name, description, price, category = validate_menu_item(name, description, price, category)
    new_path = await store_image(image, user_id)
    try:
        with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(
                "insert into public.menu_items (owner_id, name, description, price, category, is_available, image_path) "
                "values (%s, %s, %s, %s, %s, %s, %s) returning *",
                (user_id, name, description, price, category, is_available, new_path),
            )
            row = cur.fetchone()
            return serialize_menu_item(row)
    except Exception:
        remove_image_best_effort(new_path)
        raise


@router.put("/menu-items/{item_id}")
async def update_menu_item(
    item_id: UUID,
    name: Annotated[str, Form()],
    price: Annotated[Decimal, Form()],
    user_id: Annotated[UUID, Depends(current_user)],
    description: Annotated[str, Form()] = "",
    category: Annotated[str, Form()] = "Main",
    is_available: Annotated[bool, Form()] = True,
    remove_existing_image: bool = Form(default=False),
    image: UploadFile | None = File(default=None),
):
    name, description, price, category = validate_menu_item(name, description, price, category)
    if image and remove_existing_image:
        raise HTTPException(422, "Choose a replacement image or remove the current image")
    new_path = await store_image(image, user_id)
    old_path = None
    path = None
    try:
        with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute("select * from public.menu_items where id = %s for update", (item_id,))
            old = cur.fetchone()
            if old is None:
                raise HTTPException(404, "Menu item not found")
            if old["owner_id"] != user_id:
                raise HTTPException(403, "You can only edit your own menu items")
            old_path = old["image_path"]
            path = new_path if new_path else (None if remove_existing_image else old_path)
            cur.execute(
                "update public.menu_items set name = %s, description = %s, price = %s, category = %s, "
                "is_available = %s, image_path = %s, updated_at = now() where id = %s returning *",
                (name, description, price, category, is_available, path, item_id),
            )
            row = cur.fetchone()
    except Exception:
        remove_image_best_effort(new_path)
        raise
    if old_path and old_path != path:
        remove_image_best_effort(old_path)
    return serialize_menu_item(row)


@router.delete("/menu-items/{item_id}", status_code=204)
def delete_menu_item(item_id: UUID, user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select owner_id, image_path from public.menu_items where id = %s for update", (item_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(404, "Menu item not found")
        if row["owner_id"] != user_id:
            raise HTTPException(403, "You can only delete your own menu items")
        cur.execute("delete from public.menu_items where id = %s", (item_id,))
    remove_image_best_effort(row["image_path"])