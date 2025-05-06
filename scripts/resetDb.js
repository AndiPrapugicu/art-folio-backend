const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

async function resetDatabase() {
  try {
    // Calea către fișierul SQLite
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const uploadsPath = path.join(__dirname, '..', 'uploads');

    // Șterge fișierul bazei de date dacă există
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Fișierul bazei de date vechi a fost șters.');
    }

    // Șterge și recreează directorul uploads
    if (fs.existsSync(uploadsPath)) {
      fs.rmSync(uploadsPath, { recursive: true, force: true });
      console.log('Directorul uploads a fost șters.');
    }
    fs.mkdirSync(uploadsPath);
    fs.mkdirSync(path.join(uploadsPath, 'artworks'));
    fs.mkdirSync(path.join(uploadsPath, 'products'));
    console.log('Directorul uploads a fost recreat.');

    // Creează o nouă instanță Sequelize
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
    });

    // Definește modelele
    const User = sequelize.define('User', {
      username: Sequelize.STRING,
      email: Sequelize.STRING,
      password: Sequelize.STRING,
      role: Sequelize.STRING,
    });

    const Artwork = sequelize.define('Artwork', {
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      imageUrl: Sequelize.STRING,
      category: Sequelize.STRING,
      isHidden: Sequelize.BOOLEAN,
    });

    // Definește relațiile
    User.hasMany(Artwork);
    Artwork.belongsTo(User);

    // Sincronizează modelele cu baza de date
    await sequelize.sync({ force: true });

    console.log('Baza de date a fost recreată cu succes!');
    process.exit(0);
  } catch (error) {
    console.error('Eroare la resetarea bazei de date:', error);
    process.exit(1);
  }
}

resetDatabase();
