package handlers

import (
	"encoding/json"
	_ "flashcards-back/internal/middleware"
	"fmt"
	"github.com/paulrzcz/go-gigachat"
	"log"
	"net/http"
	"os"
)

func CardsFromText(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Text string `json:"text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	client, err := gigachat.NewInsecureClient(os.Getenv("CLIENT_ID"), os.Getenv("CLIENT_SECRET"))
	if err != nil {
		http.Error(w, "failed to init gpt", http.StatusInternalServerError)
		return
	}
	_ = client.Auth()

	//prompt := `Проанализируй текст, и создай на его основе флеш-карточки.
	//		Формат: массив объектов JSON вида [{"question": "...", "answer": "..."}, ...]
	//		Без пояснений. Без предисловий. Только массив в чистом JSON.`

	prompt := "Проанализируй текст и создай на его основе флеш-карточки.\n\n" +
		"Формат вывода:\n" +
		"[\n  {\"question\": \"...\", \"answer\": \"...\"},\n  ...\n]\n\n" +
		"Важно:\n" +
		"- Верни только JSON-массив.\n" +
		"- Не используй ```json или любые блоки с ```, markdown, пояснения и текст.\n" +
		"- Только ЧИСТЫЙ JSON, чтобы программа могла его распарсить."

	reqGiga := &gigachat.ChatRequest{
		Model: gigachat.GIGACHAT_2_LITE,
		Messages: []gigachat.Message{
			{
				Role:    gigachat.UserRole,
				Content: prompt + "\n\n" + req.Text,
			},
		},
	}

	resp, err := client.Chat(reqGiga)
	if err != nil || len(resp.Choices) == 0 {
		http.Error(w, "gpt error", http.StatusInternalServerError)
		return
	}

	raw := resp.Choices[0].Message.Content

	// проверка валидности
	var parsed []map[string]string
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		fmt.Println("RAW RESPONSE:", raw) // дебаг
		http.Error(w, "invalid response from model", http.StatusBadGateway)
		return
	}

	fmt.Println("- - - -\n\n", raw)
	fmt.Println("\n\n- - - -\n\n")
	fmt.Println(parsed, "\n\n- - - -")

	err = json.NewEncoder(w).Encode(parsed)
	if err != nil {
		log.Fatal(err)
		return
	}
}

func RewordQuestions(w http.ResponseWriter, r *http.Request) {
	var cards []map[string]string
	if err := json.NewDecoder(r.Body).Decode(&cards); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	client, err := gigachat.NewInsecureClient(os.Getenv("CLIENT_ID"), os.Getenv("CLIENT_SECRET"))
	if err != nil {
		http.Error(w, "gigachat error", http.StatusInternalServerError)
		return
	}
	_ = client.Auth()

	// Превращаем []map в JSON-строку
	cardsJSON, _ := json.Marshal(cards)

	prompt := `Ты — AI-помощник для учебных карточек. Твоя задача — переформулировать вопросы так, 
				чтобы сохранить смысл, но изменить формулировку.
				Пример входа:
				[
				  {"question": "Что такое API?", "answer": "Интерфейс взаимодействия программ"},
				  {"question": "Объясни работу HTTP", "answer": "Протокол передачи гипертекста"}
				]
				
				Твоя задача: вернуть JSON-массив с такими же ответами, но с изменёнными формулировками вопросов.
				
				Формат ответа:
				[
				  {"question": "Для чего нужен API?", "answer": "Интерфейс взаимодействия программ"},
				  {"question": "Как работает HTTP?", "answer": "Протокол передачи гипертекста"}
				]
				
				Важно: не меняй ответы, не добавляй пояснений, верни **только JSON**.`

	req := &gigachat.ChatRequest{
		Model: gigachat.GIGACHAT_2_LITE,
		Messages: []gigachat.Message{
			{Role: gigachat.UserRole, Content: prompt + "\n\n" + string(cardsJSON)},
		},
	}

	resp, err := client.Chat(req)
	if err != nil || len(resp.Choices) == 0 {
		http.Error(w, "gpt error", http.StatusBadGateway)
		return
	}

	content := resp.Choices[0].Message.Content
	var reformatted []map[string]string
	if err := json.Unmarshal([]byte(content), &reformatted); err != nil {
		log.Println("GigaChat ответ:", content) // debug
		http.Error(w, "invalid json from model", http.StatusBadGateway)
		return
	}

	json.NewEncoder(w).Encode(reformatted)
}
