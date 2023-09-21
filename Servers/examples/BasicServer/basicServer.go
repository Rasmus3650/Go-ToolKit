package main

import (
	"fmt"
	"log"
	"net/http"
)

// -------------------- SIMPLE EXAMPLE OF A ROUTER --------------------
type router struct {
}

func (r *router) serveHTTP(w http.ResponseWriter, req *http.Request) {
	switch req.URL.Path {
	case "/a":
		fmt.Fprintf(w, "Executing /a")
	case "/b":
		fmt.Fprintf(w, "Executing /b")
	case "/c":
		fmt.Fprintf(w, "Executing /c")
	default:
		http.Error(w, "404 Not Found", 404)
	}
}

// -------------------- SIMPLE EXAMPLE OF A SERVER --------------------
func hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello %s\n", r.URL.Query().Get("name"))
}

// -------------------- SIMPLE EXAMPLE OF MIDDLEWARE --------------------
type logger struct {
	Inner http.Handler
}

func (l *logger) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("start")
	l.Inner.ServeHTTP(w, r)
	log.Println("finish")
}
func main() {

	// ----- SERVER -----

	//http.HandleFunc("/hello", hello)
	//http.ListenAndServe(":8000", nil)

	// ----- ROUTER -----

	//var r router
	//http.ListenAndServe(":8000", &r)

	// ----- MIDDLEWARE -----

	f := http.HandlerFunc(hello)
	l := logger{Inner: f}
	http.ListenAndServe(":8000", &l)
}
