"""
Trains a toxic-vs-clean text classifier for post/comment moderation.

Positive (toxic) examples come from the Jigsaw-style toxic comment datasets.
Negative (clean) examples come from the Dreaddit dataset's post text — its own
"stress" label is deliberately ignored; a post expressing exam stress/anxiety
is exactly the on-topic content this community exists for, not something to
flag. Dreaddit is used here purely as a source of realistic, non-toxic,
forum-post-shaped text to contrast against the toxic examples.

Run from apps/embeddings/: python3 train_toxicity.py
"""

import csv
import json
import sys
from pathlib import Path

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

DATASET_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("datasets")
MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "toxicity_model.joblib"


def read_csv(path, column):
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        return [row[column].strip() for row in csv.DictReader(f) if row.get(column, "").strip()]


def load_examples():
    toxic = set()
    clean = set()

    for name in ["toxic_big/toxic_comments_50000.csv", "toxic_big/toxic_comments_dataset.csv"]:
        for text in read_csv(DATASET_DIR / name, "comment_text"):
            toxic.add(text)

    small = DATASET_DIR / "toxic_small/toxic_comment_classification.csv"
    with open(small, newline="", encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            text = row["comment_text"].strip()
            if not text:
                continue
            (toxic if row["label"].strip().lower() == "toxic" else clean).add(text)

    for name in ["dreaddit/dreaddit-train.csv", "dreaddit/dreaddit-test.csv"]:
        for text in read_csv(DATASET_DIR / name, "text"):
            clean.add(text)

    # Dreaddit text can legitimately overlap in phrasing with nothing toxic;
    # drop any accidental exact overlap between the two sets either way.
    overlap = toxic & clean
    toxic -= overlap
    clean -= overlap

    return list(toxic), list(clean)


def main():
    toxic_texts, clean_texts = load_examples()
    print(f"Loaded {len(toxic_texts)} toxic examples, {len(clean_texts)} clean examples")

    texts = toxic_texts + clean_texts
    labels = [1] * len(toxic_texts) + [0] * len(clean_texts)

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.15, random_state=42, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=2, max_features=50000)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    report = classification_report(y_test, y_pred, target_names=["clean", "toxic"])
    matrix = confusion_matrix(y_test, y_pred).tolist()

    print("\n=== Held-out test set (15% of data, never seen during training) ===")
    print(report)
    print("Confusion matrix [[TN, FP], [FN, TP]]:", matrix)

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nSaved model to {MODEL_PATH}")

    metrics = {
        "toxic_examples": len(toxic_texts),
        "clean_examples": len(clean_texts),
        "test_size": len(y_test),
        "confusion_matrix": matrix,
        "report": report,
    }
    (MODEL_DIR / "toxicity_metrics.json").write_text(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
