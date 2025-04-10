package repository

import (
	"flashcards-back/internal/config"
	"flashcards-back/internal/models"
)

func CreateUser(user models.User) error {
	_, err := config.DB.Exec(
		"INSERT INTO users (name, password_hash) VALUES (?, ?)",
		user.Name, user.PasswordHash,
	)

	return err
}

func GetUserByName(name string) (*models.User, error) {
	user := &models.User{}
	err := config.DB.QueryRow(
		"SELECT id, name, password_hash, created_at FROM users WHERE name = ?",
		name,
	).Scan(&user.ID, &user.Name, &user.PasswordHash, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	return user, err
}
