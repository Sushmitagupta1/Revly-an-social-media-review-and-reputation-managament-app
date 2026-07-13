import csv
import io
from datetime import datetime

from app.models.review import Review


def export_reviews_csv(reviews: list[Review]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Platform", "Reviewer", "Rating", "Sentiment",
        "Text", "Topics", "Resolved", "Date"
    ])
    for r in reviews:
        writer.writerow([
            str(r.id),
            r.platform,
            r.reviewer_name,
            r.rating,
            r.sentiment or "",
            r.text or "",
            ",".join(r.topics) if r.topics else "",
            r.is_resolved,
            r.created_at.isoformat() if r.created_at else "",
        ])
    return output.getvalue()
