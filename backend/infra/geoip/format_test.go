package geoip

import "testing"

func TestFormatRegion_China(t *testing.T) {
	got := FormatRegion("中国|广东省|深圳市|电信|CN")
	want := "广东省·深圳市 (电信)"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestFormatRegion_Overseas(t *testing.T) {
	got := FormatRegion("United States|California|San Jose|xTom|US")
	if got == "" {
		t.Fatal("expected non-empty")
	}
}
