import sqlite3

conn = sqlite3.connect('learnbridge.db')
cursor = conn.cursor()

print("--- CONFUSION FINGERPRINTS ---")
try:
    cursor.execute("SELECT * FROM confusion_fingerprints")
    cols = [description[0] for description in cursor.description]
    print("Columns:", cols)
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("Error:", e)

conn.close()
