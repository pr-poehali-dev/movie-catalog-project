import os
import json
import base64
import uuid
import boto3
from botocore.exceptions import ClientError


def handler(event: dict, context) -> dict:
    """Загрузка картинок и видео-ссылок для фильмов в S3"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    # Простая защита через заголовок
    admin_key = event.get("headers", {}).get("X-Admin-Key", "")
    if admin_key != os.environ.get("ADMIN_KEY", "cinemaxx-admin"):
        return {"statusCode": 403, "headers": cors, "body": json.dumps({"error": "Forbidden"})}

    body = json.loads(event.get("body") or "{}")
    file_type = body.get("type")  # "poster" | "video_url"
    film_id = body.get("film_id")

    if not film_id:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "film_id required"})}

    # Загрузка видео — просто сохраняем URL (YouTube embed)
    if file_type == "video_url":
        video_url = body.get("url", "")
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"success": True, "url": video_url}),
        }

    # Загрузка изображения (постер) — base64
    file_data = body.get("data")  # base64 строка
    mime = body.get("mime", "image/jpeg")

    if not file_data:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "data required"})}

    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
    ext = ext_map.get(mime, "jpg")
    key = f"films/{film_id}/poster_{uuid.uuid4().hex[:8]}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

    image_bytes = base64.b64decode(file_data)
    s3.put_object(Bucket="files", Key=key, Body=image_bytes, ContentType=mime)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"success": True, "url": cdn_url, "key": key}),
    }
