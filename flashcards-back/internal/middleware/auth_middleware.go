package middleware

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt"
	"net/http"
	"strings"
)

var jwtSecret = []byte("secret_key")

type Claims struct {
	UserID int `json:"user_id"`
	jwt.StandardClaims
}

type ctxKey string

const UserKey ctxKey = "userId"

func AuthMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		parts := strings.Split(auth, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "auth needed", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "wrong token", http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "invalid token payload", http.StatusUnauthorized)
			return
		}
		userId := int(userIDFloat)

		ctx := context.WithValue(r.Context(), UserKey, userId)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			return
		}

		next.ServeHTTP(w, r)
	})
}

func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

func ExtractAuthContext(w http.ResponseWriter, r *http.Request) context.Context {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := ParseToken(tokenStr)
	if err != nil {
		return nil
	}

	ctx := context.WithValue(r.Context(), UserKey, claims.UserID)
	return ctx
}
