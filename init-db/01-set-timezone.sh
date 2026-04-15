#!/bin/bash
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER DATABASE $POSTGRES_DB SET timezone TO 'Asia/Ho_Chi_Minh';"
