from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Change these credentials to match your PostgreSQL setup
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:ala1nna@localhost/historian"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()