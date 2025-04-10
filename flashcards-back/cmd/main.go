package main

import (
	"flashcards-back/internal/config"
	"flashcards-back/internal/handlers"
	"flashcards-back/internal/middleware"
	"github.com/joho/godotenv"
	"log"
	"net/http"
	"os"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println(".env file load error")
	}

	config.Init()

	mux := http.NewServeMux()

	mux.HandleFunc("/register", handlers.Register)
	mux.HandleFunc("/login", handlers.Login)
	mux.Handle("/decks", middleware.AuthMiddleWare(http.HandlerFunc(handlers.DecksHandler)))
	mux.Handle("/decks/", middleware.AuthMiddleWare(http.HandlerFunc(handlers.DeckByIDHandler)))
	mux.Handle("/ai/cards", middleware.AuthMiddleWare(http.HandlerFunc(handlers.CardsFromText)))
	mux.Handle("/ai/reword", middleware.AuthMiddleWare(http.HandlerFunc(handlers.RewordQuestions)))
	mux.HandleFunc("/shared/", handlers.SharedDeckHandler)

	handler := middleware.EnableCORS(mux)

	log.Println("start serving. port: " + os.Getenv("PORT"))
	err = http.ListenAndServe(":"+os.Getenv("PORT"), handler)
	if err != nil {
		log.Fatal(err)
		return
	}
}
