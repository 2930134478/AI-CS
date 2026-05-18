package geoip

import "strings"

// FormatRegion 将 ip2region 原始串格式化为客服可读位置（最长约 200 字符）。
// 原始格式：国家|省份|城市|ISP|国家代码
func FormatRegion(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	parts := strings.Split(raw, "|")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	if len(parts) == 0 {
		return ""
	}

	country := ""
	province := ""
	city := ""
	isp := ""
	if len(parts) > 0 {
		country = parts[0]
	}
	if len(parts) > 1 {
		province = parts[1]
	}
	if len(parts) > 2 {
		city = parts[2]
	}
	if len(parts) > 3 {
		isp = parts[3]
	}

	// 中国：省略国家，优先「省·市」，运营商单独括号
	if country == "中国" || country == "China" {
		loc := joinNonEmpty("·", province, city)
		if loc == "" {
			loc = country
		}
		if isp != "" && isp != "0" {
			return trimToMax(loc+" ("+isp+")", 200)
		}
		return trimToMax(loc, 200)
	}

	loc := joinNonEmpty(" · ", country, province, city)
	if loc == "" {
		loc = country
	}
	if isp != "" && isp != "0" {
		return trimToMax(loc+" ("+isp+")", 200)
	}
	return trimToMax(loc, 200)
}

func joinNonEmpty(sep string, items ...string) string {
	var out []string
	for _, s := range items {
		s = strings.TrimSpace(s)
		if s == "" || s == "0" {
			continue
		}
		out = append(out, s)
	}
	return strings.Join(out, sep)
}

func trimToMax(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}
