import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "prelegal.db"


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT    UNIQUE NOT NULL,
                password_hash TEXT    NOT NULL DEFAULT '',
                created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        # Migrate older schema that lacked password_hash
        try:
            await db.execute(
                "ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''"
            )
        except Exception:
            pass  # column already exists

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token      TEXT    PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                expires_at TEXT    NOT NULL
            )
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS saved_documents (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                doc_type   TEXT    NOT NULL,
                doc_name   TEXT    NOT NULL DEFAULT '',
                fields     TEXT    NOT NULL DEFAULT '{}',
                created_at TEXT    NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """
        )

        await db.commit()


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
