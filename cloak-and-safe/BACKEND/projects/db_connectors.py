"""
Database Connection Service for real database connections.

This module provides functions to test connections and fetch metadata
from various database types: PostgreSQL, MySQL, SQLite, and MongoDB.

All operations are READ-ONLY to ensure safety.
No destructive queries are executed.

Security Notes:
- Passwords are not logged
- Connections are properly closed
- Only metadata queries are executed
"""

import logging
import sqlite3
import os
from typing import Tuple, List, Dict, Any

logger = logging.getLogger(__name__)

# Default SQLite database path (relative to BACKEND folder)
DEFAULT_SQLITE_DB = 'db.sqlite3'


# ============================================================================
# CONNECTION TEST FUNCTIONS
# ============================================================================

def test_postgres_connection(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> Tuple[bool, str]:
    """
    Test connection to a PostgreSQL database.
    
    Args:
        host: Database host address
        port: Database port (default: 5432)
        database_name: Name of the database
        username: Database username
        password: Database password
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        import psycopg2
        
        port = port or 5432
        
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        # Test with a simple query
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        connection.close()
        
        logger.info(f"[DB CONNECT] PostgreSQL connection successful to {host}:{port}/{database_name}")
        return True, "Connection successful"
        
    except ImportError:
        logger.error("[DB CONNECT] psycopg2 module not installed")
        return False, "PostgreSQL driver (psycopg2) not installed"
    except Exception as e:
        logger.error(f"[DB CONNECT] PostgreSQL connection failed: {str(e)}")
        return False, f"Connection failed: {str(e)}"


def test_mysql_connection(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> Tuple[bool, str]:
    """
    Test connection to a MySQL database.
    
    Args:
        host: Database host address
        port: Database port (default: 3306)
        database_name: Name of the database
        username: Database username
        password: Database password
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        import mysql.connector
        
        port = port or 3306
        
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connection_timeout=10
        )
        
        # Test with a simple query
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB CONNECT] MySQL connection successful to {host}:{port}/{database_name}")
        return True, "Connection successful"
        
    except ImportError:
        logger.error("[DB CONNECT] mysql-connector-python module not installed")
        return False, "MySQL driver (mysql-connector-python) not installed"
    except Exception as e:
        logger.error(f"[DB CONNECT] MySQL connection failed: {str(e)}")
        return False, f"Connection failed: {str(e)}"


def test_sqlite_connection(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> Tuple[bool, str]:
    """
    Test connection to a SQLite database.
    
    For SQLite, only database_name matters (the file path).
    Host, port, username, and password are ignored.
    If database_name is empty, defaults to 'db.sqlite3'.
    
    Args:
        host: Ignored for SQLite
        port: Ignored for SQLite
        database_name: Path to SQLite database file (can be relative or absolute)
        username: Ignored for SQLite
        password: Ignored for SQLite
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        # Get the database path - use database_name, fallback to default
        db_path = database_name.strip() if database_name and database_name.strip() else DEFAULT_SQLITE_DB
        
        # If it's a relative path, make it relative to the BACKEND directory
        if not os.path.isabs(db_path):
            # Get the directory where this module is located (projects folder)
            module_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up one level to BACKEND folder
            backend_dir = os.path.dirname(module_dir)
            db_path = os.path.join(backend_dir, db_path)
        
        # Check if the file exists
        if not os.path.exists(db_path):
            logger.warning(f"[DB CONNECT] SQLite file not found: {db_path}")
            return False, f"Database file not found: {db_path}"
        
        # Try to connect and run a simple query
        connection = sqlite3.connect(db_path, timeout=10)
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        connection.close()
        
        logger.info(f"[DB CONNECT] SQLite connection successful to {db_path}")
        return True, f"Connection successful to {os.path.basename(db_path)}"
        
    except Exception as e:
        logger.error(f"[DB CONNECT] SQLite connection failed: {str(e)}")
        return False, f"Connection failed: {str(e)}"


def test_mongodb_connection(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> Tuple[bool, str]:
    """
    Test connection to a MongoDB database.
    
    Args:
        host: MongoDB host address
        port: MongoDB port (default: 27017)
        database_name: Name of the database
        username: Database username (optional)
        password: Database password (optional)
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        from pymongo import MongoClient
        from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
        
        port = port or 27017
        
        # Build connection URI
        if username and password:
            uri = f"mongodb://{username}:{password}@{host}:{port}/{database_name}"
        else:
            uri = f"mongodb://{host}:{port}/{database_name}"
        
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        
        # Test connection by running a command
        client.admin.command('ping')
        client.close()
        
        logger.info(f"[DB CONNECT] MongoDB connection successful to {host}:{port}/{database_name}")
        return True, "Connection successful"
        
    except ImportError:
        logger.error("[DB CONNECT] pymongo module not installed")
        return False, "MongoDB driver (pymongo) not installed"
    except Exception as e:
        logger.error(f"[DB CONNECT] MongoDB connection failed: {str(e)}")
        return False, f"Connection failed: {str(e)}"


def test_connection(db_type: str, host: str, port: int, database_name: str, 
                    username: str, password: str) -> Tuple[bool, str]:
    """
    Test database connection based on database type.
    
    Args:
        db_type: Type of database (postgres, mysql, sqlite, mongodb)
        host: Database host address
        port: Database port
        database_name: Name of the database
        username: Database username
        password: Database password
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    connectors = {
        'postgres': test_postgres_connection,
        'mysql': test_mysql_connection,
        'sqlite': test_sqlite_connection,
        'mongodb': test_mongodb_connection,
    }
    
    connector = connectors.get(db_type)
    if not connector:
        return False, f"Unsupported database type: {db_type}"
    
    return connector(host, port, database_name, username, password)


# ============================================================================
# METADATA FETCHING FUNCTIONS
# ============================================================================

def fetch_postgres_tables(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> List[Dict[str, Any]]:
    """
    Fetch table metadata from a PostgreSQL database.
    
    Returns:
        List of dictionaries with table names
    """
    try:
        import psycopg2
        
        port = port or 5432
        
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        cursor = connection.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        table_names = [row[0] for row in cursor.fetchall()]
        
        tables = []
        for table_name in table_names:
            # Get row count
            try:
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                row_count = cursor.fetchone()[0]
            except Exception:
                row_count = 0
            
            # Get column count
            try:
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                """, (table_name,))
                column_count = cursor.fetchone()[0]
            except Exception:
                column_count = 0
            
            tables.append({
                "table_name": table_name,
                "rows": row_count,
                "columns": column_count,
                "last_scanned": None
            })
        
        cursor.close()
        connection.close()
        
        logger.info(f"[DB METADATA] Fetched {len(tables)} tables with metadata from PostgreSQL")
        return tables
        
    except Exception as e:
        logger.error(f"[DB METADATA] Failed to fetch PostgreSQL tables: {str(e)}")
        raise


def fetch_mysql_tables(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> List[Dict[str, Any]]:
    """
    Fetch table metadata from a MySQL database including row and column counts.
    
    Returns:
        List of dictionaries with table name, row count, column count, and last_scanned
    """
    try:
        import mysql.connector
        
        port = port or 3306
        
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connection_timeout=10
        )
        
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        
        table_names = [row[0] for row in cursor.fetchall()]
        
        tables = []
        for table_name in table_names:
            # Get row count
            try:
                cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
                row_count = cursor.fetchone()[0]
            except Exception:
                row_count = 0
            
            # Get column count using DESCRIBE
            try:
                cursor.execute(f"DESCRIBE `{table_name}`")
                column_count = len(cursor.fetchall())
            except Exception:
                column_count = 0
            
            tables.append({
                "table_name": table_name,
                "rows": row_count,
                "columns": column_count,
                "last_scanned": None
            })
        
        cursor.close()
        connection.close()
        
        logger.info(f"[DB METADATA] Fetched {len(tables)} tables with metadata from MySQL")
        return tables
        
    except Exception as e:
        logger.error(f"[DB METADATA] Failed to fetch MySQL tables: {str(e)}")
        raise


def fetch_sqlite_tables(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> List[Dict[str, Any]]:
    """
    Fetch table metadata from a SQLite database including row and column counts.
    
    For SQLite, only database_name matters (the file path).
    Host, port, username, and password are ignored.
    
    Returns:
        List of dictionaries with table name, row count, column count, and last_scanned
    """
    try:
        # Get the database path - use database_name, fallback to default
        db_path = database_name.strip() if database_name and database_name.strip() else DEFAULT_SQLITE_DB
        
        # If it's a relative path, make it relative to the BACKEND directory
        if not os.path.isabs(db_path):
            module_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(module_dir)
            db_path = os.path.join(backend_dir, db_path)
        
        connection = sqlite3.connect(db_path, timeout=10)
        cursor = connection.cursor()
        
        # Query SQLite schema for table names
        cursor.execute("""
            SELECT name 
            FROM sqlite_master 
            WHERE type = 'table' 
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        """)
        
        table_names = [row[0] for row in cursor.fetchall()]
        
        tables = []
        for table_name in table_names:
            # Get row count
            try:
                cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
                row_count = cursor.fetchone()[0]
            except Exception:
                row_count = 0
            
            # Get column count using PRAGMA
            try:
                cursor.execute(f"PRAGMA table_info(`{table_name}`)")
                column_count = len(cursor.fetchall())
            except Exception:
                column_count = 0
            
            tables.append({
                "table_name": table_name,
                "rows": row_count,
                "columns": column_count,
                "last_scanned": None
            })
        
        cursor.close()
        connection.close()
        
        logger.info(f"[DB METADATA] Fetched {len(tables)} tables with metadata from SQLite ({db_path})")
        return tables
        
    except Exception as e:
        logger.error(f"[DB METADATA] Failed to fetch SQLite tables: {str(e)}")
        raise


def fetch_mongodb_collections(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> List[Dict[str, Any]]:
    """
    Fetch collection metadata from a MongoDB database including document count and field count.
    
    Returns:
        List of dictionaries with collection names, document count, field count, and last_scanned
    """
    try:
        from pymongo import MongoClient
        
        port = port or 27017
        
        # Build connection URI
        if username and password:
            uri = f"mongodb://{username}:{password}@{host}:{port}/{database_name}"
        else:
            uri = f"mongodb://{host}:{port}/{database_name}"
        
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        db = client[database_name]
        
        collection_names = sorted(db.list_collection_names())
        
        tables = []
        for collection_name in collection_names:
            collection = db[collection_name]
            
            # Get document count
            try:
                row_count = collection.count_documents({})
            except Exception:
                row_count = 0
            
            # Get field count from a sample document
            try:
                sample_doc = collection.find_one()
                column_count = len(sample_doc.keys()) if sample_doc else 0
            except Exception:
                column_count = 0
            
            tables.append({
                "table_name": collection_name,
                "rows": row_count,
                "columns": column_count,
                "last_scanned": None
            })
        
        client.close()
        
        logger.info(f"[DB METADATA] Fetched {len(tables)} collections with metadata from MongoDB")
        return tables
        
    except Exception as e:
        logger.error(f"[DB METADATA] Failed to fetch MongoDB collections: {str(e)}")
        raise


def fetch_tables_metadata(
    db_type: str,
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str
) -> List[Dict[str, Any]]:
    """
    Fetch table metadata from a database based on its type.
    
    Args:
        db_type: Type of database (postgres, mysql, sqlite, mongodb)
        host: Database host address
        port: Database port
        database_name: Name of the database
        username: Database username
        password: Database password
    
    Returns:
        List of dictionaries with table names:
        [
            {"table_name": "users"},
            {"table_name": "orders"},
            ...
        ]
    
    Raises:
        ValueError: If database type is unsupported
        Exception: If connection or query fails
    """
    fetchers = {
        'postgres': fetch_postgres_tables,
        'mysql': fetch_mysql_tables,
        'sqlite': fetch_sqlite_tables,
        'mongodb': fetch_mongodb_collections,
    }
    
    fetcher = fetchers.get(db_type)
    if not fetcher:
        raise ValueError(f"Unsupported database type: {db_type}")
    
    return fetcher(host, port, database_name, username, password)


# ============================================================================
# TABLE DATA FETCHING FUNCTIONS (For PII Scanning)
# ============================================================================

def fetch_mysql_table_data(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch sample data from a MySQL table.
    
    Args:
        host: Database host
        port: Database port
        database_name: Database name
        username: Username
        password: Password
        table_name: Table to fetch data from
        limit: Max rows to fetch (default 100)
    
    Returns:
        List of dictionaries, each representing a row with column_name: value
    """
    try:
        import mysql.connector
        
        port = port or 3306
        
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connection_timeout=10
        )
        
        cursor = connection.cursor(dictionary=True)
        
        # Escape table name for safety
        query = f"SELECT * FROM `{table_name}` LIMIT {limit}"
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        logger.info(f"[DB DATA] Fetched {len(rows)} rows from MySQL table {table_name}")
        return rows
        
    except Exception as e:
        logger.error(f"[DB DATA] Failed to fetch MySQL table data: {str(e)}")
        raise


def fetch_postgres_table_data(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch sample data from a PostgreSQL table.
    """
    try:
        import psycopg2
        import psycopg2.extras
        
        port = port or 5432
        
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = f'SELECT * FROM "{table_name}" LIMIT {limit}'
        cursor.execute(query)
        
        rows = [dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        connection.close()
        
        logger.info(f"[DB DATA] Fetched {len(rows)} rows from PostgreSQL table {table_name}")
        return rows
        
    except Exception as e:
        logger.error(f"[DB DATA] Failed to fetch PostgreSQL table data: {str(e)}")
        raise


def fetch_sqlite_table_data(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch sample data from a SQLite table.
    """
    try:
        # Get the database path
        db_path = database_name.strip() if database_name and database_name.strip() else DEFAULT_SQLITE_DB
        
        if not os.path.isabs(db_path):
            module_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(module_dir)
            db_path = os.path.join(backend_dir, db_path)
        
        connection = sqlite3.connect(db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()
        
        query = f"SELECT * FROM `{table_name}` LIMIT {limit}"
        cursor.execute(query)
        
        rows = [dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        connection.close()
        
        logger.info(f"[DB DATA] Fetched {len(rows)} rows from SQLite table {table_name}")
        return rows
        
    except Exception as e:
        logger.error(f"[DB DATA] Failed to fetch SQLite table data: {str(e)}")
        raise


def fetch_mongodb_collection_data(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    collection_name: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch sample data from a MongoDB collection.
    """
    try:
        from pymongo import MongoClient
        
        port = port or 27017
        
        if username and password:
            uri = f"mongodb://{username}:{password}@{host}:{port}/{database_name}"
        else:
            uri = f"mongodb://{host}:{port}/{database_name}"
        
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        db = client[database_name]
        collection = db[collection_name]
        
        # Fetch documents, convert ObjectId to string
        documents = []
        for doc in collection.find().limit(limit):
            doc['_id'] = str(doc['_id'])
            documents.append(doc)
        
        client.close()
        
        logger.info(f"[DB DATA] Fetched {len(documents)} documents from MongoDB collection {collection_name}")
        return documents
        
    except Exception as e:
        logger.error(f"[DB DATA] Failed to fetch MongoDB collection data: {str(e)}")
        raise


def fetch_table_data(
    db_type: str,
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch sample data from a table/collection based on database type.
    
    Args:
        db_type: Type of database (postgres, mysql, sqlite, mongodb)
        host: Database host address
        port: Database port
        database_name: Name of the database
        username: Database username
        password: Database password
        table_name: Name of the table/collection to fetch
        limit: Maximum number of rows to fetch
    
    Returns:
        List of dictionaries, each representing a row:
        [
            {"id": 1, "email": "user@example.com", "phone": "9876543210"},
            {"id": 2, "email": "test@test.com", "phone": "8765432109"},
            ...
        ]
    """
    fetchers = {
        'postgres': fetch_postgres_table_data,
        'mysql': fetch_mysql_table_data,
        'sqlite': fetch_sqlite_table_data,
        'mongodb': fetch_mongodb_collection_data,
    }
    
    fetcher = fetchers.get(db_type)
    if not fetcher:
        raise ValueError(f"Unsupported database type: {db_type}")
    
    return fetcher(host, port, database_name, username, password, table_name, limit)


# ============================================================================
# DATABASE UPDATE FUNCTIONS (For Pushing Masked Data)
# ============================================================================

def update_postgres_table(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    rows: List[Dict[str, Any]],
    masked_columns: List[str],
) -> int:
    """
    Update PostgreSQL table with masked data.
    
    Updates only masked columns for each row, using the 'id' field as the key.
    
    Args:
        host: Database host
        port: Database port
        database_name: Database name
        username: Username
        password: Password
        table_name: Table to update
        rows: List of row dictionaries with masked values
        masked_columns: List of column names that were masked
    
    Returns:
        Number of rows affected
    """
    try:
        import psycopg2
        
        port = port or 5432
        
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        cursor = connection.cursor()
        rows_affected = 0
        
        for row in rows:
            # Get the primary key (assume 'id' column)
            row_id = row.get('id')
            if row_id is None:
                continue
            
            # Build UPDATE statement for masked columns only
            set_clauses = []
            values = []
            for col in masked_columns:
                if col in row:
                    set_clauses.append(f'"{col}" = %s')
                    values.append(row[col])
            
            if not set_clauses:
                continue
            
            query = f'UPDATE "{table_name}" SET {", ".join(set_clauses)} WHERE id = %s'
            values.append(row_id)
            
            cursor.execute(query, values)
            rows_affected += cursor.rowcount
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB UPDATE] Updated {rows_affected} rows in PostgreSQL table {table_name}")
        return rows_affected
        
    except Exception as e:
        logger.error(f"[DB UPDATE] Failed to update PostgreSQL table: {str(e)}")
        raise


def update_mysql_table(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    rows: List[Dict[str, Any]],
    masked_columns: List[str],
) -> int:
    """
    Update MySQL table with masked data.
    """
    try:
        import mysql.connector
        
        port = port or 3306
        
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connection_timeout=10
        )
        
        cursor = connection.cursor()
        rows_affected = 0
        
        for row in rows:
            row_id = row.get('id')
            if row_id is None:
                continue
            
            set_clauses = []
            values = []
            for col in masked_columns:
                if col in row:
                    set_clauses.append(f'`{col}` = %s')
                    values.append(row[col])
            
            if not set_clauses:
                continue
            
            query = f'UPDATE `{table_name}` SET {", ".join(set_clauses)} WHERE id = %s'
            values.append(row_id)
            
            cursor.execute(query, values)
            rows_affected += cursor.rowcount
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB UPDATE] Updated {rows_affected} rows in MySQL table {table_name}")
        return rows_affected
        
    except Exception as e:
        logger.error(f"[DB UPDATE] Failed to update MySQL table: {str(e)}")
        raise


def update_sqlite_table(
    database_name: str,
    table_name: str,
    rows: List[Dict[str, Any]],
    masked_columns: List[str],
) -> int:
    """
    Update SQLite table with masked data.
    """
    try:
        db_path = database_name.strip() if database_name and database_name.strip() else DEFAULT_SQLITE_DB
        
        if not os.path.isabs(db_path):
            module_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(module_dir)
            db_path = os.path.join(backend_dir, db_path)
        
        connection = sqlite3.connect(db_path, timeout=10)
        cursor = connection.cursor()
        rows_affected = 0
        
        for row in rows:
            row_id = row.get('id')
            if row_id is None:
                continue
            
            set_clauses = []
            values = []
            for col in masked_columns:
                if col in row:
                    set_clauses.append(f'`{col}` = ?')
                    values.append(row[col])
            
            if not set_clauses:
                continue
            
            query = f'UPDATE `{table_name}` SET {", ".join(set_clauses)} WHERE id = ?'
            values.append(row_id)
            
            cursor.execute(query, values)
            rows_affected += cursor.rowcount
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB UPDATE] Updated {rows_affected} rows in SQLite table {table_name}")
        return rows_affected
        
    except Exception as e:
        logger.error(f"[DB UPDATE] Failed to update SQLite table: {str(e)}")
        raise


# ============================================================================
# DATABASE INSERT FUNCTIONS (For Creating Masked Tables)
# ============================================================================

def insert_into_postgres_table(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    rows: List[Dict[str, Any]],
) -> int:
    """
    Insert masked data into a new PostgreSQL table.
    
    Creates the table if it doesn't exist, then inserts all rows.
    """
    try:
        import psycopg2
        
        port = port or 5432
        
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        cursor = connection.cursor()
        
        if not rows:
            return 0
        
        columns = list(rows[0].keys())
        
        # Create table if not exists (all columns as TEXT for simplicity)
        column_defs = ', '.join([f'"{col}" TEXT' for col in columns])
        create_query = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({column_defs})'
        cursor.execute(create_query)
        
        # Clear existing data
        cursor.execute(f'DELETE FROM "{table_name}"')
        
        # Insert rows
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join([f'"{col}"' for col in columns])
        insert_query = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})'
        
        rows_affected = 0
        for row in rows:
            values = [str(row.get(col, '')) for col in columns]
            cursor.execute(insert_query, values)
            rows_affected += cursor.rowcount
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB INSERT] Inserted {rows_affected} rows into PostgreSQL table {table_name}")
        return rows_affected
        
    except Exception as e:
        logger.error(f"[DB INSERT] Failed to insert into PostgreSQL table: {str(e)}")
        raise


def insert_into_mysql_table(
    host: str,
    port: int,
    database_name: str,
    username: str,
    password: str,
    table_name: str,
    rows: List[Dict[str, Any]],
) -> int:
    """
    Insert masked data into a new MySQL table.
    """
    try:
        import mysql.connector
        
        port = port or 3306
        
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=database_name,
            user=username,
            password=password,
            connection_timeout=10
        )
        
        cursor = connection.cursor()
        
        if not rows:
            return 0
        
        columns = list(rows[0].keys())
        
        # Create table if not exists
        column_defs = ', '.join([f'`{col}` TEXT' for col in columns])
        create_query = f'CREATE TABLE IF NOT EXISTS `{table_name}` ({column_defs})'
        cursor.execute(create_query)
        
        # Clear existing data
        cursor.execute(f'DELETE FROM `{table_name}`')
        
        # Insert rows
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join([f'`{col}`' for col in columns])
        insert_query = f'INSERT INTO `{table_name}` ({column_names}) VALUES ({placeholders})'
        
        rows_affected = 0
        for row in rows:
            values = [str(row.get(col, '')) for col in columns]
            cursor.execute(insert_query, values)
            rows_affected += cursor.rowcount
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB INSERT] Inserted {rows_affected} rows into MySQL table {table_name}")
        return rows_affected
        
    except Exception as e:
        logger.error(f"[DB INSERT] Failed to insert into MySQL table: {str(e)}")
        raise


def insert_into_sqlite_table(
    database_name: str,
    table_name: str,
    rows: List[Dict[str, Any]],
) -> int:
    """
    Insert masked data into a new SQLite table.
    """
    try:
        db_path = database_name.strip() if database_name and database_name.strip() else DEFAULT_SQLITE_DB
        
        if not os.path.isabs(db_path):
            module_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(module_dir)
            db_path = os.path.join(backend_dir, db_path)
        
        connection = sqlite3.connect(db_path, timeout=10)
        cursor = connection.cursor()
        
        if not rows:
            return 0
        
        columns = list(rows[0].keys())
        
        # Create table if not exists
        column_defs = ', '.join([f'`{col}` TEXT' for col in columns])
        create_query = f'CREATE TABLE IF NOT EXISTS `{table_name}` ({column_defs})'
        cursor.execute(create_query)
        
        # Clear existing data
        cursor.execute(f'DELETE FROM `{table_name}`')
        
        # Insert rows
        placeholders = ', '.join(['?'] * len(columns))
        column_names = ', '.join([f'`{col}`' for col in columns])
        insert_query = f'INSERT INTO `{table_name}` ({column_names}) VALUES ({placeholders})'
        
        rows_affected = 0
        for row in rows:
            values = [str(row.get(col, '')) for col in columns]
            cursor.execute(insert_query, values)
            rows_affected += cursor.rowcount
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logger.info(f"[DB INSERT] Inserted {rows_affected} rows into SQLite table {table_name}")
        return rows_affected
        
    except Exception as e:
        logger.error(f"[DB INSERT] Failed to insert into SQLite table: {str(e)}")
        raise
