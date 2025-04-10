package models

import "time"

type User struct {
	ID           int
	Name         string
	PasswordHash string
	CreatedAt    time.Time
}
