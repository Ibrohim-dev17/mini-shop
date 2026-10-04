from flask import Flask, request, redirect, jsonify
import sqlite3
import os

app = Flask(__name__, static_url_path='', static_folder='.')

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ma'lumotlar bazasini yaratish
def init_db():
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, cat_id INTEGER, name TEXT, price TEXT, old_price TEXT, discount TEXT, img TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS banners (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, img TEXT, link TEXT)''')
    conn.commit()
    conn.close()

init_db()

# Asosiy sahifa (index.html yoki admin.html)
@app.route('/')
def home():
    if os.path.exists('admin.html'):
        return app.send_static_file('admin.html')
    return "admin.html topilmadi"

# --- API SO'ROVLARI (Ma'lumotlarni JSON qilib berish) ---
@app.route('/api/categories')
def get_categories():
    conn = sqlite3.connect('shop.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)

@app.route('/api/products')
def get_products():
    cat_id = request.args.get('cat_id')
    conn = sqlite3.connect('shop.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if cat_id:
        cursor.execute("SELECT name FROM categories WHERE id = ?", (cat_id,))
        cat = cursor.fetchone()
        cat_name = cat["name"] if cat else "Kategoriya"
        cursor.execute("SELECT * FROM products WHERE cat_id = ?", (cat_id,))
    else:
        cat_name = "Barcha mahsulotlar"
        cursor.execute("SELECT * FROM products")
        
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"category_name": cat_name, "products": products})

@app.route('/api/banners')
def get_banners():
    conn = sqlite3.connect('shop.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM banners")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)

# --- QO'SHISH AMALLARI (POST) ---
@app.route('/add-category', methods=['POST'])
def add_category():
    name = request.form.get('name')
    if name:
        conn = sqlite3.connect('shop.db')
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            conn.commit()
        except sqlite3.IntegrityError:
            pass
        conn.close()
    return redirect('/admin-all-categories.html')

@app.route('/add-product', methods=['POST'])
def add_product():
    cat_id = request.form.get('cat_id')
    new_cat_name = request.form.get('new_cat_name')
    name = request.form.get('name')
    price = request.form.get('price')
    old_price = request.form.get('old_price', '')
    discount = request.form.get('discount', '')
    
    image_url = ""
    if 'image' in request.files:
        file = request.files['image']
        if file.filename:
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            image_url = f"/{file_path}"

    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()

    if cat_id == 'new' and new_cat_name:
        try:
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (new_cat_name,))
            conn.commit()
            cat_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            cursor.execute("SELECT id FROM categories WHERE name = ?", (new_cat_name,))
            row = cursor.fetchone()
            cat_id = row[0] if row else None

    if name and price and cat_id:
        cursor.execute("""
            INSERT INTO products (cat_id, name, price, old_price, discount, img) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (cat_id, name, price, old_price, discount, image_url))
        conn.commit()

    conn.close()
    return redirect('/admin-all-categories.html')

@app.route('/add-banner', methods=['POST'])
def add_banner():
    title = request.form.get('title', '')
    image_url = ""
    if 'image' in request.files:
        file = request.files['image']
        if file.filename:
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            image_url = f"/{file_path}"

    if image_url:
        conn = sqlite3.connect('shop.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO banners (title, img, link) VALUES (?, ?, ?)", (title, image_url, ''))
        conn.commit()
        conn.close()

    return redirect('/admin-all-banners.html')

# --- O'CHIRISH AMALLARI ---
@app.route('/delete-category')
def delete_category():
    cat_id = request.args.get('id')
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    cursor.execute("DELETE FROM products WHERE cat_id = ?", (cat_id,))
    conn.commit()
    conn.close()
    return redirect('/admin-all-categories.html')

@app.route('/delete-product')
def delete_product():
    prod_id = request.args.get('id')
    cat_id = request.args.get('cat_id')
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (prod_id,))
    conn.commit()
    conn.close()
    return redirect(f'/admin-product.html?cat_id={cat_id}')

@app.route('/delete-banner')
def delete_banner():
    banner_id = request.args.get('id')
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM banners WHERE id = ?", (banner_id,))
    conn.commit()
    conn.close()
    return redirect('/admin-all-banners.html')

# --- TAHRIRLASH AMALLARI ---
@app.route('/edit-category')
def edit_category():
    cat_id = request.args.get('id')
    name = request.args.get('name')
    if cat_id and name:
        conn = sqlite3.connect('shop.db')
        cursor = conn.cursor()
        cursor.execute("UPDATE categories SET name = ? WHERE id = ?", (name, cat_id))
        conn.commit()
        conn.close()
    return redirect('/admin-all-categories.html')

@app.route('/edit-product')
def edit_product():
    prod_id = request.args.get('id')
    cat_id = request.args.get('cat_id')
    name = request.args.get('name')
    price = request.args.get('price')
    if prod_id and name and price:
        conn = sqlite3.connect('shop.db')
        cursor = conn.cursor()
        cursor.execute("UPDATE products SET name = ?, price = ? WHERE id = ?", (name, price, prod_id))
        conn.commit()
        conn.close()
    return redirect(f'/admin-product.html?cat_id={cat_id}')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8000, debug=True)
