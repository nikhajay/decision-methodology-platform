from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import URL

from app.core.config import settings
from app.db.base import Base
from app.models import User


# ---------------------------------------------------------
# Alembic Config
# ---------------------------------------------------------

config = context.config

print("========== ALEMBIC ENV LOADED 1 ==========")
# ---------------------------------------------------------
# Database URL
# ---------------------------------------------------------

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=settings.DATABASE_USER,
    password=settings.DATABASE_PASSWORD,
    host=settings.DATABASE_HOST,
    port=settings.DATABASE_PORT,
    database=settings.DATABASE_NAME,
)

config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.render_as_string(
        hide_password=False
    ).replace("%", "%%")
)

print("========== ALEMBIC ENV LOADED 2 ==========")
# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ---------------------------------------------------------
# SQLAlchemy Metadata
# ---------------------------------------------------------

target_metadata = Base.metadata
print("========== ALEMBIC ENV LOADED 3 ==========")

# ---------------------------------------------------------
# Offline Migration
# ---------------------------------------------------------

def run_migrations_offline() -> None:

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()

print("========== ALEMBIC ENV LOADED 4 ==========")
# ---------------------------------------------------------
# Online Migration
# ---------------------------------------------------------

def run_migrations_online() -> None:

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():

            context.run_migrations()

print("========== ALEMBIC ENV LOADED 5 ==========")
# ---------------------------------------------------------
# Run Migration
# ---------------------------------------------------------

if context.is_offline_mode():
    print("========== ALEMBIC ENV LOADED is_offline_mode 1 ==========")
    run_migrations_offline()
    print("========== ALEMBIC ENV LOADED is_offline_mode 2 ==========")
else:
    print("========== ALEMBIC ENV LOADED is_offline_mode else 1 ==========")
    run_migrations_online()
    print("========== ALEMBIC ENV LOADED is_offline_mode else 2 ==========")

print("========== ALEMBIC ENV LOADED end ==========")