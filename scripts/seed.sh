#!/bin/bash
# Seed Kerala Super Store with rich sample data
set -e
BASE="http://localhost:3000/api"
H="Content-Type: application/json"

echo "==> Settings"
curl -s -X POST $BASE/settings -H "$H" -d '{"key":"store_name","value":"Kerala Super Store"}' > /dev/null
curl -s -X POST $BASE/settings -H "$H" -d '{"key":"whatsapp_number","value":"447749132122"}' > /dev/null
curl -s -X POST $BASE/settings -H "$H" -d '{"key":"store_address","value":"Old Market Street, M98DX, Manchester"}' > /dev/null
curl -s -X POST $BASE/settings -H "$H" -d '{"key":"currency","value":"GBP"}' > /dev/null

echo "==> Collection"
COL=$(curl -s -X POST $BASE/collections -H "$H" -d '{"name":"Groceries","slug":"groceries","description":"Authentic South Indian pantry staples","sortOrder":0,"isActive":true}')
COL_ID=$(echo $COL | grep -oE '"id":[0-9]+' | head -1 | grep -oE '[0-9]+')
echo "  Collection id=$COL_ID"

echo "==> Categories"
declare -A CATS
for entry in "Rice & Grains:rice-grains:🌾" "Spices:spices:🌶️" "Snacks:snacks:🍪" "Beverages:beverages:☕" "Dairy:dairy:🧀" "Frozen:frozen:❄️"; do
  IFS=':' read -r name slug emoji <<< "$entry"
  RES=$(curl -s -X POST $BASE/categories -H "$H" -d "{\"name\":\"$name\",\"slug\":\"$slug\",\"description\":\"\",\"collectionId\":$COL_ID,\"sortOrder\":0,\"isActive\":true}")
  ID=$(echo $RES | grep -oE '"id":[0-9]+' | head -1 | grep -oE '[0-9]+')
  CATS[$slug]=$ID
  echo "  $name -> $ID"
done

echo "==> Products"
add_item() {
  local name="$1" slug="$2" price="$3" cat="$4" desc="$5" compare="${6:-}" stock="${7:-20}"
  local body="{\"name\":\"$name\",\"slug\":\"$slug\",\"price\":\"$price\",\"categoryId\":${CATS[$cat]},\"description\":\"$desc\",\"stock\":$stock,\"sortOrder\":0,\"isActive\":true"
  if [ -n "$compare" ]; then body="$body,\"compareAtPrice\":\"$compare\""; fi
  body="$body}"
  curl -s -X POST $BASE/items -H "$H" -d "$body" > /dev/null
  echo "  + $name"
}
add_item "Basmati Rice 5kg" "basmati-rice-5kg" "8.99" "rice-grains" "Premium long-grain basmati, aged 12 months." "12.99" 30
add_item "Kerala Red Rice 2kg" "kerala-red-rice-2kg" "6.50" "rice-grains" "Traditional matta rice, hand-pounded." "" 25
add_item "Sona Masoori 5kg" "sona-masoori-5kg" "7.99" "rice-grains" "Lightweight aromatic rice for daily meals." "9.99" 40
add_item "Cardamom 100g" "cardamom-100g" "4.50" "spices" "Whole green cardamom from Idukki hills." "" 50
add_item "Black Pepper 200g" "black-pepper-200g" "3.99" "spices" "Tellicherry garbled black pepper." "5.50" 45
add_item "Turmeric Powder 250g" "turmeric-powder-250g" "2.50" "spices" "Stone-ground, high-curcumin turmeric." "" 60
add_item "Garam Masala 100g" "garam-masala-100g" "2.99" "spices" "House-blend Kerala garam masala." "" 55
add_item "Banana Chips 200g" "banana-chips-200g" "3.50" "snacks" "Crisp nendran chips in coconut oil." "4.50" 80
add_item "Jackfruit Chips 150g" "jackfruit-chips-150g" "4.25" "snacks" "Thin-sliced raw jackfruit chips." "" 40
add_item "Kerala Mixture 250g" "kerala-mixture-250g" "3.99" "snacks" "Classic savoury mixture with peanuts." "" 70
add_item "Murukku 200g" "murukku-200g" "3.50" "snacks" "Hand-pressed rice flour murukku." "" 45
add_item "Filter Coffee Powder 200g" "filter-coffee-200g" "4.99" "beverages" "80/20 coffee-chicory blend." "" 50
add_item "Masala Chai 100g" "masala-chai-100g" "3.50" "beverages" "Traditional spiced tea mix." "4.99" 60
add_item "Coconut Oil 1L" "coconut-oil-1l" "5.99" "dairy" "Cold-pressed virgin coconut oil." "7.50" 35
add_item "Pure Ghee 500g" "pure-ghee-500g" "7.50" "dairy" "A2 cow ghee, traditionally churned." "" 25
add_item "Frozen Paratha 10pc" "frozen-paratha-10pc" "4.50" "frozen" "Ready-to-cook whole wheat paratha." "5.99" 40
add_item "Frozen Kerala Fish Curry" "frozen-fish-curry" "6.99" "frozen" "Meen curry in coconut gravy." "" 20

echo "==> Offers"
add_offer() {
  local name="$1" emoji="$2" tag="$3" old="$4" new="$5" disc="$6"
  curl -s -X POST $BASE/offers -H "$H" -d "{\"name\":\"$name\",\"emoji\":\"$emoji\",\"tag\":\"$tag\",\"oldPrice\":\"$old\",\"newPrice\":\"$new\",\"discount\":\"$disc\",\"sortOrder\":0,\"isActive\":true}" > /dev/null
  echo "  + $name"
}
add_offer "Basmati Rice 5kg" "🍚" "LIMITED TIME" "12.99" "8.99" "-30%"
add_offer "Banana Chips Combo" "🍘" "MEGA DEAL" "9.96" "5.99" "-40%"
add_offer "Spice Combo Pack" "🌶️" "BEST VALUE" "15.99" "11.99" "-25%"
add_offer "Masala Chai Bundle" "☕" "HOT DEAL" "11.97" "7.99" "-35%"
add_offer "Coconut Oil 2L" "🥥" "FRESH" "9.98" "7.99" "-20%"

echo "==> Slides"
add_slide() {
  local title="$1" sub="$2" btn="$3" link="$4"
  curl -s -X POST $BASE/slides -H "$H" -d "{\"title\":\"$title\",\"subtitle\":\"$sub\",\"image\":\"\",\"buttonText\":\"$btn\",\"link\":\"$link\",\"sortOrder\":0,\"isActive\":true,\"width\":1920,\"height\":1080}" > /dev/null
  echo "  + $title"
}
add_slide "Up to 40% OFF on Groceries" "Fresh vegetables, fruits, spices & more at unbeatable prices." "Shop the shelves" "#products"
add_slide "Onam Collection is Here" "Traditional Kerala dresses, hampers & festive essentials." "Shop Onam" "#onam"
add_slide "Free Delivery over £30" "Cash on delivery available across the UK." "Order Now" "#products"
add_slide "Fresh Kerala Spices & Snacks" "Authentic cardamom, pepper, banana chips — taste of home." "Explore" "#products"

echo "==> Dresses"
add_dress() {
  local name="$1" type="$2" price="$3" compare="$4" sizes="$5" desc="$6"
  local body="{\"name\":\"$name\",\"type\":\"$type\",\"price\":\"$price\",\"description\":\"$desc\",\"sizes\":[$sizes],\"colors\":[\"Gold\",\"White\"],\"stock\":15,\"sortOrder\":0,\"isActive\":true"
  if [ -n "$compare" ]; then body="$body,\"compareAtPrice\":\"$compare\""; fi
  body="$body}"
  curl -s -X POST $BASE/dresses -H "$H" -d "$body" > /dev/null
  echo "  + $name"
}
add_dress "Kerala Kasavu Saree" "ladies" "89.00" "120.00" "\"S\",\"M\",\"L\",\"XL\"" "Handloom Kasavu saree with golden zari border."
add_dress "Ladies Half Saree (Settu)" "ladies" "65.00" "85.00" "\"S\",\"M\",\"L\"" "Traditional half-saree for Onam."
add_dress "Gents Mundu & Shirt Set" "gents" "49.00" "" "\"M\",\"L\",\"XL\",\"2XL\"" "Kasavu mundu paired with cotton shirt."
add_dress "Boys Mundu Set" "kids" "35.00" "" "\"3-5\",\"6-8\",\"9-12\"" "Mini mundu set for little gentlemen."
add_dress "Girls Frock Combo (3pc)" "kids" "45.00" "60.00" "\"2-4\",\"5-7\",\"8-10\"" "Three-piece frock combo in festive colors."
add_dress "Family Onam Combo Pack" "combo" "180.00" "240.00" "\"Assorted\"" "Complete family dress set — 4 members."

echo "==> Winners"
add_winner() {
  local name="$1" prize="$2" event="$3" photo="$4"
  curl -s -X POST $BASE/winners -H "$H" -d "{\"name\":\"$name\",\"prize\":\"$prize\",\"event\":\"$event\",\"photo\":\"$photo\",\"sortOrder\":0,\"isActive\":true}" > /dev/null
  echo "  + $name"
}
add_winner "Rajesh Kumar" "Won: £100 Voucher" "Onam 2025" "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
add_winner "Priya Menon" "Won: Free Groceries" "Onam 2025" "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
add_winner "Suresh Nair" "Won: Gold Coin" "Christmas 2025" "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh"
add_winner "Lakshmi Pillai" "Won: £50 Voucher" "New Year 2026" "https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi"
add_winner "Mohan Das" "Won: Free Delivery 1 Yr" "Onam 2024" "https://api.dicebear.com/7.x/avataaars/svg?seed=Mohan"
add_winner "Anitha Varma" "Won: Kerala Saree" "Vishu 2025" "https://api.dicebear.com/7.x/avataaars/svg?seed=Anitha"

echo ""
echo "==> Done. Final counts:"
for ep in collections categories items offers dresses slides winners; do
  n=$(curl -s $BASE/$ep | grep -oE '"id":[0-9]+' | wc -l)
  echo "  $ep: $n"
done
