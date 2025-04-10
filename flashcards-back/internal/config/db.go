package config

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

var DB *sql.DB

func Init() {
	var err error
	DB, err = sql.Open("sqlite3", "./flashcards.db")
	if err != nil {
		log.Fatal("error connecting to DB: ", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("error ping DB: ", err)
	}

	createTables()
	log.Println("db connection success")
}

func createTables() {
	usersTable := `CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE,
		password_hash TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	deckTable := `
	CREATE TABLE IF NOT EXISTS decks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		title TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		is_public BOOLEAN DEFAULT FALSE
	);`

	cardTable := `
	CREATE TABLE IF NOT EXISTS cards (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		deck_id INTEGER,
		question TEXT,
		answer TEXT
	);`

	_, err := DB.Exec(usersTable)
	if err != nil {
		log.Fatalf("Error while creating users table: %v", err)
	}

	_, err = DB.Exec(deckTable)
	if err != nil {
		log.Fatalf("Error while creating decks table: %v", err)
	}

	_, err = DB.Exec(cardTable)
	if err != nil {
		log.Fatalf("Error while creating card table: %v", err)
	}
}
