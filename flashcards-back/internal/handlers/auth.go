package handlers

import (
	"encoding/json"
	"flashcards-back/internal/models"
	"flashcards-back/internal/repository"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Password string `json:"password"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	hashedPass, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	user := models.User{
		Name:         req.Name,
		PasswordHash: string(hashedPass),
	}

	if err := repository.CreateUser(user); err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			http.Error(w, "user with this name already exists", http.StatusConflict)
			return
		}
		http.Error(w, "register error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)

	response := map[string]string{"message": "success: user created"}
	log.Println("(register) User", req.Name, "created")

	err := json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Fatal(err)
		return
	}
}

func Login(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Name     string `json:"name"`
		Password string `json:"password"`
	}
	_ = json.NewDecoder(r.Body).Decode(&creds)

	user, err := repository.GetUserByName(creds.Name)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash),
		[]byte(creds.Password)) != nil {
		http.Error(w, "wrong data (or password)", http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenStr, _ := token.SignedString(jwtSecret)

	log.Println("(login) Token created:", tokenStr)

	err = json.NewEncoder(w).Encode(map[string]string{"token": tokenStr})
	if err != nil {
		log.Fatal(err)
		return
	}
}
