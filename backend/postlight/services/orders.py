from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, Field


class OrderItemIn(BaseModel):
    menu_item_id: UUID
    quantity: int = Field(ge=1, le=50)


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1, max_length=50)
    note: str = Field(default="", max_length=500)


def price_order(cur, items: list[OrderItemIn]):
    """Look up current menu prices and return (lines, total)."""
    quantities: dict[UUID, int] = {}
    for item in items:
        quantities[item.menu_item_id] = quantities.get(item.menu_item_id, 0) + item.quantity
    if any(quantity > 50 for quantity in quantities.values()):
        raise HTTPException(422, "You can order at most 50 of one dish")

    cur.execute(
        "select id, name, price, is_available from public.menu_items where id = any(%s)",
        (list(quantities),),
    )
    found = {row["id"]: row for row in cur.fetchall()}

    lines = []
    total = Decimal("0.00")
    for menu_item_id, quantity in quantities.items():
        row = found.get(menu_item_id)
        if row is None:
            raise HTTPException(404, "A dish in your order no longer exists")
        if not row["is_available"]:
            raise HTTPException(422, f"{row['name']} is not available right now")
        lines.append(
            {
                "menu_item_id": menu_item_id,
                "name": row["name"],
                "unit_price": row["price"],
                "quantity": quantity,
            }
        )
        total += row["price"] * quantity
    return lines, total.quantize(Decimal("0.01"))


def serialize_order(order: dict, items: list[dict]) -> dict:
    return {
        "id": str(order["id"]),
        "customer_id": str(order["customer_id"]),
        "status": order["status"],
        "note": order["note"],
        "total": float(order["total"]),
        "created_at": order["created_at"].isoformat(),
        "updated_at": order["updated_at"].isoformat(),
        "items": [
            {
                "menu_item_id": str(item["menu_item_id"]) if item["menu_item_id"] else None,
                "name": item["name"],
                "unit_price": float(item["unit_price"]),
                "quantity": item["quantity"],
            }
            for item in items
        ],
    }