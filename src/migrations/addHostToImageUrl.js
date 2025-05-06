const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const HOST_PREFIX = 'http://localhost:3000';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Eroare la conectarea la baza de date:', err);
    process.exit(1);
  }
  console.log('Conectat la baza de date SQLite');
});

const updateImageUrls = () => {
  // Mai întâi afișăm URL-urile curente
  db.all('SELECT id, imageUrl FROM artwork', (err, rows) => {
    if (err) {
      console.error('Eroare la citirea URL-urilor curente:', err);
      return;
    }
    console.log('URL-uri înainte de actualizare:');
    rows.forEach((row) => {
      console.log(`ID: ${row.id}, URL: ${row.imageUrl}`);
    });

    // Apoi facem actualizarea
    const sql = `
      UPDATE artwork 
      SET imageUrl = CASE
        WHEN imageUrl LIKE 'http://%' THEN imageUrl
        WHEN imageUrl LIKE 'https://%' THEN imageUrl
        ELSE '${HOST_PREFIX}' || imageUrl
      END
      WHERE imageUrl IS NOT NULL
    `;

    db.run(sql, function (err) {
      if (err) {
        console.error('Eroare la actualizarea URL-urilor:', err);
        process.exit(1);
      }

      console.log(`\nActualizate ${this.changes} înregistrări`);

      // Verificăm rezultatele după actualizare
      db.all('SELECT id, imageUrl FROM artwork', (err, updatedRows) => {
        if (err) {
          console.error('Eroare la verificarea rezultatelor:', err);
        } else {
          console.log('\nURL-uri după actualizare:');
          updatedRows.forEach((row) => {
            console.log(`ID: ${row.id}, URL: ${row.imageUrl}`);
          });
        }

        // Închidem conexiunea
        db.close((err) => {
          if (err) {
            console.error('Eroare la închiderea conexiunii:', err);
          }
          console.log('\nMigrare completă');
        });
      });
    });
  });
};

// Adăugăm un handler pentru erori necaptate
process.on('uncaughtException', (err) => {
  console.error('Eroare necaptată:', err);
  db.close(() => {
    process.exit(1);
  });
});

// Rulăm migrarea
console.log('Începem migrarea...');
updateImageUrls();
