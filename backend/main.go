package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type PingResponse struct {
	Message string `json:"message"`
}

func main() {
	//根路由
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, World!")
	})

	// /ping路由
	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := PingResponse{Message: "pong"}
		json.NewEncoder(w).Encode(resp)
	})

	fmt.Println("Server is running on port 8080")
	http.ListenAndServe(":8080", nil)
}
