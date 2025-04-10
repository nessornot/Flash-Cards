package handlers

import (
	"database/sql"
	"encoding/json"
	"flashcards-back/internal/config"
	"flashcards-back/internal/middleware"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type CreateDeckRequest struct {
	Title    string            `json:"title"`
	Cards    map[string]string `json:"cards"`
	IsPublic bool              `json:"is_public"`
}

func CreateDeck(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserKey).(int)

	var req CreateDeckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid requet", http.StatusBadRequest)
		return
	}

	tx, err := config.DB.Begin()
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	res, err := tx.Exec("INSERT INTO decks (user_id, title, is_public, created_at) VALUES (?, ?, ?, ?)", userID, req.Title, req.IsPublic, time.Now())
	if err != nil {
		_ = tx.Rollback()
		http.Error(w, "failed to save deck", http.StatusInternalServerError)
		return
	}

	deckID, err := res.LastInsertId()
	if err != nil {
		_ = tx.Rollback()
		http.Error(w, "failed to get deck ID", http.StatusInternalServerError)
		return
	}

	stmt, err := tx.Prepare("INSERT INTO cards (deck_id, question, answer) VALUES (?, ?, ?)")
	if err != nil {
		_ = tx.Rollback()
		http.Error(w, "failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	for q, a := range req.Cards {
		_, err := stmt.Exec(deckID, q, a)
		if err != nil {
			_ = tx.Rollback()
			http.Error(w, "failed to insert cards", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "failed to commit", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "deck created"})
}

func GetUserDecks(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserKey).(int)

	query := `
	SELECT decks.id, decks.title, decks.is_public, users.name AS author_name,
	      COUNT(cards.id) AS cards_count
	FROM decks
	LEFT JOIN cards ON decks.id = cards.deck_id
	LEFT JOIN users ON users.id = decks.user_id
	WHERE decks.user_id = ?
	GROUP BY decks.id
	ORDER BY decks.created_at DESC;
	`

	rows, err := config.DB.Query(query, userID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type DeckInfo struct {
		ID         int    `json:"id"`
		Title      string `json:"title"`
		IsPublic   bool   `json:"is_public"`
		AuthorName string `json:"author_name"`
		CardsCount int    `json:"cards_count"`
	}

	var decks []DeckInfo
	for rows.Next() {
		var deck DeckInfo
		if err := rows.Scan(&deck.ID, &deck.Title, &deck.IsPublic, &deck.AuthorName, &deck.CardsCount); err != nil {
			http.Error(w, "scan error", http.StatusInternalServerError)
			return
		}
		decks = append(decks, deck)
	}

	_ = json.NewEncoder(w).Encode(decks)
}

func DecksHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetUserDecks(w, r)
	case http.MethodPost:
		CreateDeck(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func DeleteDeck(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserKey).(int)

	idStr := strings.TrimPrefix(r.URL.Path, "/decks/")
	deckID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid deck ID", http.StatusBadRequest)
		return
	}

	// deleting deck for current user
	tx, err := config.DB.Begin()
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec("DELETE FROM cards WHERE deck_id = ?", deckID)
	if err != nil {
		_ = tx.Rollback()
		http.Error(w, "failed to delete cards", http.StatusInternalServerError)
		return
	}

	res, err := tx.Exec("DELETE FROM decks WHERE id = ? AND user_id = ?", deckID, userID)
	if err != nil {
		tx.Rollback()
		http.Error(w, "failed to delete deck", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		tx.Rollback()
		http.Error(w, "not found or forbidden", http.StatusForbidden)
		return
	}

	_ = tx.Commit()
	w.WriteHeader(http.StatusNoContent)
}

func GetDeckByID(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserKey).(int)
	idStr := strings.TrimPrefix(r.URL.Path, "/decks/")
	deckID, _ := strconv.Atoi(idStr)

	row := config.DB.QueryRow("SELECT title, is_public FROM decks WHERE id = ? AND user_id = ?", deckID, userID)
	var title string
	var isPublic bool
	if err := row.Scan(&title, &isPublic); err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	cardRows, _ := config.DB.Query("SELECT question, answer FROM cards WHERE deck_id = ?", deckID)
	defer func(cardRows *sql.Rows) {
		err := cardRows.Close()
		if err != nil {
			log.Println(err)
		}
	}(cardRows)

	cards := map[string]string{}
	for cardRows.Next() {
		var q, a string
		_ = cardRows.Scan(&q, &a)
		cards[q] = a
	}

	err := json.NewEncoder(w).Encode(map[string]interface{}{
		"title":     title,
		"is_public": isPublic,
		"cards":     cards,
	})
	if err != nil {
		log.Println(err)
		return
	}
}

func UpdateDeck(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserKey).(int)
	idStr := strings.TrimPrefix(r.URL.Path, "/decks/")
	deckID, _ := strconv.Atoi(idStr)

	var req struct {
		Title    string            `json:"title"`
		Cards    map[string]string `json:"cards"`
		IsPublic bool              `json:"is_public"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Println(err)
		return
	}

	tx, _ := config.DB.Begin()
	_, _ = tx.Exec("UPDATE decks SET title = ?, is_public = ? WHERE id = ? AND user_id = ?", req.Title, req.IsPublic, deckID, userID)
	_, _ = tx.Exec("DELETE FROM cards WHERE deck_id = ?", deckID)

	stmt, _ := tx.Prepare("INSERT INTO cards (deck_id, question, answer) VALUES (?, ?, ?)")
	defer stmt.Close()

	for q, a := range req.Cards {
		_, _ = stmt.Exec(deckID, q, a)
	}
	err = tx.Commit()
	if err != nil {
		log.Println(err)
		return
	}

	err = json.NewEncoder(w).Encode(map[string]string{"message": "updated"})
	if err != nil {
		log.Println(err)
		return
	}
}

func DeckByIDHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetDeckByID(w, r)
	case http.MethodPut:
		UpdateDeck(w, r)
	case http.MethodDelete:
		DeleteDeck(w, r)
	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func getDeckIDFromPath(path string) int {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 2 {
		return 0 // или -1, или panic, в зависимости от твоей обработки
	}

	id, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0 // или обработай ошибку по-другому
	}
	return id
}

func GetSharedDeck(w http.ResponseWriter, r *http.Request) {
	deckID := getDeckIDFromPath(r.URL.Path)
	row := config.DB.QueryRow(`
		SELECT title FROM decks WHERE id = ? AND is_public = TRUE
	`, deckID)

	var title string
	if err := row.Scan(&title); err != nil {
		http.Error(w, "not found or not public", http.StatusNotFound)
		return
	}

	cardRows, _ := config.DB.Query("SELECT question, answer FROM cards WHERE deck_id = ?", deckID)
	defer cardRows.Close()

	cards := map[string]string{}
	for cardRows.Next() {
		var q, a string
		cardRows.Scan(&q, &a)
		cards[q] = a
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"title": title,
		"cards": cards,
	})
}

func CopySharedDeck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(middleware.UserKey).(int)
	deckID := getDeckIDFromPath(r.URL.Path)

	// Получаем набор
	var title string
	row := config.DB.QueryRow(`SELECT title FROM decks WHERE id = ? AND is_public = TRUE`, deckID)
	if err := row.Scan(&title); err != nil {
		http.Error(w, "not found or not public", http.StatusNotFound)
		return
	}

	cardRows, _ := config.DB.Query("SELECT question, answer FROM cards WHERE deck_id = ?", deckID)
	defer cardRows.Close()

	tx, _ := config.DB.Begin()
	res, _ := tx.Exec("INSERT INTO decks (user_id, title) VALUES (?, ?)", userID, title+" (копия)")
	newDeckID, _ := res.LastInsertId()

	stmt, _ := tx.Prepare("INSERT INTO cards (deck_id, question, answer) VALUES (?, ?, ?)")
	defer stmt.Close()

	for cardRows.Next() {
		var q, a string
		cardRows.Scan(&q, &a)
		stmt.Exec(newDeckID, q, a)
	}

	tx.Commit()

	json.NewEncoder(w).Encode(map[string]string{"message": "copied"})
}

func SharedDeckHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetSharedDeck(w, r)

	case http.MethodPost:
		// проверяем авторизацию вручную
		ctx := middleware.ExtractAuthContext(w, r)
		if ctx == nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		r = r.WithContext(ctx)
		CopySharedDeck(w, r)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
