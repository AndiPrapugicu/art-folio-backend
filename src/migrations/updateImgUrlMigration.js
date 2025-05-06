"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = require("sqlite3");
const path_1 = require("path");
const dbPath = (0, path_1.join)(__dirname, '..', 'database.sqlite');
const db = new sqlite3_1.Database(dbPath, (err) => {
    if (err) {
        console.error('Eroare la conectarea la baza de date:', err);
        process.exit(1);
    }
    console.log('Conectat la baza de date SQLite');
});
const updateImageUrls = () => {
    const sql = `
    UPDATE artwork 
    SET imageUrl = REPLACE(
      imageUrl, 
      '/uploads/', 
      '/uploads/artworks/'
    )
    WHERE imageUrl LIKE '%/uploads/%' 
    AND imageUrl NOT LIKE '%/uploads/artworks/%'
  `;
    db.run(sql, function (err) {
        if (err) {
            console.error('Eroare la actualizarea URL-urilor:', err);
            process.exit(1);
        }
        console.log(`Actualizate ${this.changes} înregistrări`);
        db.all('SELECT id, imageUrl FROM artwork', (err, rows) => {
            if (err) {
                console.error('Eroare la verificarea rezultatelor:', err);
            }
            else {
                console.log('URL-uri actualizate:');
                rows.forEach((row) => {
                    console.log(`ID: ${row.id}, URL: ${row.imageUrl}`);
                });
            }
            db.close((err) => {
                if (err) {
                    console.error('Eroare la închiderea conexiunii:', err);
                }
                console.log('Migrare completă');
            });
        });
    });
};
updateImageUrls();
//# sourceMappingURL=updateImgUrlMigration.js.map