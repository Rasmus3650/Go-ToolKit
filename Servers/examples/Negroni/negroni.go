package main

import (
	"context"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/urfave/negroni"
	"net/http"
)

// -------------------- Trivial Middleware --------------------
type trivial struct {
}

func (t *trivial) serveHTTP(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	fmt.Println("Executing Trivial Middleware")
	next(w, r)
}

// -------------------- Basic (Bad) Auth Middleware --------------------

type basicAuth struct {
	Username string
	Password string
}

func (b *basicAuth) ServeHTTP(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	username := r.URL.Query().Get("username")
	password := r.URL.Query().Get("password")
	if username != b.Username && password != b.Password {
		http.Error(w, "Unauthorized", 401)
		return
	}
	ctx := context.WithValue(r.Context(), "username", username)
	r = r.WithContext(ctx)
	next(w, r)
}
func hello(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	fmt.Fprintf(w, "Hi %s\n", username)
}

func main() {
	// ----- Trivial -----

	/*
		r := mux.NewRouter()
		n := negroni.Classic()
		n.Use(&trivial{})
		n.UseHandler(r)
		http.ListenAndServe(":8000", n)*/

	// ----- Auth -----
	r := mux.NewRouter()
	r.HandleFunc("/hello", hello).Methods("GET")
	n := negroni.Classic()
	n.Use(&basicAuth{
		Username: "admin",
		Password: "admin",
	})
	n.UseHandler(r)
	http.ListenAndServe(":8000", n)
}
