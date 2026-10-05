from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Brauzerdan so'rov kelganda to'siq bo'lmasligi uchun

# Baza o'rnidagi ma'lumotlar (Buni keyinchalik SQLite yoki faylga ulab qo'yamiz)
categories = [
    {"id": 1, "name": "Tapichka", "img": "https://picsum.photos/100/100?random=10"},
    {"id": 2, "name": "Telefon", "img": "https://picsum.photos/100/100?random=11"},
    {"id": 3, "name": "Blender", "img": "https://picsum.photos/100/100?random=12"},
    {"id": 4, "name": "Dazmol", "img": "https://picsum.photos/100/100?random=13"},
    {"id": 5, "name": "Noutbuk", "img": "https://picsum.photos/100/100?random=14"}
]

# 1. Kategoriyalarni olish (GET)
@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(categories)

# 2. Kategoriya nomini o'zgartirish (PUT)
@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
def update_category(cat_id):
    data = request.get_json()
    new_name = data.get('name')
    
    for cat in categories:
        if cat['id'] == cat_id:
            cat['name'] = new_name
            return jsonify({"success": True, "category": cat})
            
    return jsonify({"success": False, "error": "Kategoriya topilmadi"}), 404

if __name__ == '__main__':
    # Serverni 5000-portda ishga tushiramiz
    app.run(debug=True, port=5000)
