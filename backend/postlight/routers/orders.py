from typing import Annotated, Literal
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from postlight.database import connection
from postlight.dependencies import current_user
from postlight.services.orders import OrderCreate, price_order, serialize_order

bearer_scheme = HTTPBearer(auto_error=False)
router = APIRouter(dependencies=[Security(bearer_scheme)])


class StatusUpdate(BaseModel):
    status: Literal["pending", "preparing", "completed", "cancelled"]


def load_items(cur, order_ids):
    cur.execute(
        "select * from public.order_items where order_id = any(%s) order by id",
        (order_ids,),
    )
    grouped = {}
    for row in cur.fetchall():
        grouped.setdefault(row["order_id"], []).append(row)
    return grouped


def is_dish_owner(cur, order_id, user_id) -> bool:
    cur.execute(
        "select 1 from public.order_items oi "
        "join public.menu_items m on m.id = oi.menu_item_id "
        "where oi.order_id = %s and m.owner_id = %s limit 1",
        (order_id, user_id),
    )
    return cur.fetchone() is not None


@router.post("/orders", status_code=201)
def place_order(payload: OrderCreate, user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        lines, total = price_order(cur, payload.items)
        cur.execute(
            "insert into public.orders (customer_id, note, total) values (%s, %s, %s) returning *",
            (user_id, payload.note.strip(), total),
        )
        order = cur.fetchone()
        for line in lines:
            cur.execute(
                "insert into public.order_items (order_id, menu_item_id, name, unit_price, quantity) "
                "values (%s, %s, %s, %s, %s)",
                (order["id"], line["menu_item_id"], line["name"], line["unit_price"], line["quantity"]),
            )
        items = load_items(cur, [order["id"]]).get(order["id"], [])
        return serialize_order(order, items)


@router.get("/orders")
def list_my_orders(user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(
            "select * from public.orders where customer_id = %s order by created_at desc",
            (user_id,),
        )
        orders = cur.fetchall()
        grouped = load_items(cur, [order["id"] for order in orders])
        return [serialize_order(order, grouped.get(order["id"], [])) for order in orders]


@router.get("/orders/incoming")
def list_incoming_orders(user_id: Annotated[UUID, Depends(current_user)]):
    """Orders that contain at least one dish owned by the signed-in user."""
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(
            "select * from public.orders o where exists ("
            "  select 1 from public.order_items oi "
            "  join public.menu_items m on m.id = oi.menu_item_id "
            "  where oi.order_id = o.id and m.owner_id = %s"
            ") order by o.created_at desc",
            (user_id,),
        )
        orders = cur.fetchall()
        grouped = load_items(cur, [order["id"] for order in orders])
        return [serialize_order(order, grouped.get(order["id"], [])) for order in orders]


@router.get("/orders/{order_id}")
def get_order(order_id: UUID, user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from public.orders where id = %s", (order_id,))
        order = cur.fetchone()
        if order is None:
            raise HTTPException(404, "Order not found")
        if order["customer_id"] != user_id and not is_dish_owner(cur, order_id, user_id):
            raise HTTPException(403, "You can only view your own orders")
        items = load_items(cur, [order_id]).get(order_id, [])
        return serialize_order(order, items)


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: UUID,
    payload: StatusUpdate,
    user_id: Annotated[UUID, Depends(current_user)],
):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from public.orders where id = %s for update", (order_id,))
        order = cur.fetchone()
        if order is None:
            raise HTTPException(404, "Order not found")
        is_customer = order["customer_id"] == user_id
        is_owner = is_dish_owner(cur, order_id, user_id)
        if not (is_customer or is_owner):
            raise HTTPException(403, "You can only update orders you placed or received")
        if not is_owner and not (payload.status == "cancelled" and order["status"] == "pending"):
            raise HTTPException(403, "Customers can only cancel a pending order")
        cur.execute(
            "update public.orders set status = %s, updated_at = now() where id = %s returning *",
            (payload.status, order_id),
        )
        updated = cur.fetchone()
        items = load_items(cur, [order_id]).get(order_id, [])
        return serialize_order(updated, items)