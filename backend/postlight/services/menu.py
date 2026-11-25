from decimal import Decimal

from fastapi import HTTPException

from postlight.services.storage import image_url


def validate_menu_item(name: str, description: str, price: Decimal, category: str):
    name = name.strip()
    description = description.strip()
    category = category.strip()
    if not 1 <= len(name) <= 120:
        raise HTTPException(422, "Name must be 1 to 120 characters")
    if len(description) > 2000:
        raise HTTPException(422, "Description must be 2000 characters or fewer")
    if not 1 <= len(category) <= 60:
        raise HTTPException(422, "Category must be 1 to 60 characters")
    if price < 0 or price > 10000:
        raise HTTPException(422, "Price must be between 0 and 10000")
    if price != price.quantize(Decimal("0.01")):
        raise HTTPException(422, "Price can have at most 2 decimal places")
    return name, description, price, category


def serialize_menu_item(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "owner_id": str(row["owner_id"]),
        "name": row["name"],
        "description": row["description"],
        "price": float(row["price"]),
        "category": row["category"],
        "is_available": row["is_available"],
        "image_url": image_url(row["image_path"]),
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }