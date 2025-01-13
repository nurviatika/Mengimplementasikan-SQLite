import SQLite from 'react-native-sqlite-storage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';

const db = SQLite.openDatabase(
  {
    name: 'LibraryDatabase.db',
    location: 'default',
  },
  () => {
    console.log('Database connected!');
  },
  (error) => {
    console.log('Error: ', error);
  }
);

const App = () => {
  interface Book {
    id: number;
    title: string;
    author: string;
    year: number;
    genre: string;
  }

  const [books, setBooks] = useState<Book[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    year: '',
    genre: '',
  });

  const fetchBooksFromDB = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM Books',
        [],
        (_, results) => {
          const rows = results.rows;
          const booksData: Book[] = [];
          for (let i = 0; i < rows.length; i++) {
            booksData.push(rows.item(i));
          }
          setBooks(booksData);
        },
        (error) => {
          console.log('Error fetching data: ', error);
        }
      );
    });
  };

  const handleAddBook = () => {
    const year = parseInt(newBook.year, 10);
    if (newBook.title && newBook.author && !isNaN(year) && newBook.genre) {
      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO Books (title, author, year, genre) VALUES (?, ?, ?, ?)`,
          [newBook.title, newBook.author, year, newBook.genre],
          (_, results) => {
            if (results.rowsAffected > 0) {
              Alert.alert('Berhasil!', 'Buku berhasil ditambahkan!');
              fetchBooksFromDB();
              setIsModalVisible(false);
              setNewBook({
                title: '',
                author: '',
                year: '',
                genre: '',
              });
            }
          },
          (error) => {
            console.log('Error inserting data: ', error);
          }
        );
      });
    } else {
      Alert.alert('Gagal!', 'Semua field harus diisi dengan benar!');
    }
  };

  const handleDeleteBook = (id: number) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus buku ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          onPress: () => {
            db.transaction((tx) => {
              tx.executeSql(
                `DELETE FROM Books WHERE id = ?`,
                [id],
                (_, results) => {
                  if (results.rowsAffected > 0) {
                    Alert.alert('Berhasil!', 'Buku berhasil dihapus.');
                    fetchBooksFromDB(); 
                  }
                },
                (error) => {
                  console.log('Error deleting data: ', error);
                }
              );
            });
          },
        },
      ]
    );
  };

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          author TEXT,
          year INTEGER,
          genre TEXT
        )`
      );
    });
    fetchBooksFromDB();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>List Buku Bacaan</Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.bookCard}>
            <Text style={styles.bookText}>Judul: {item.title}</Text>
            <Text style={styles.bookText}>Penulis: {item.author}</Text>
            <Text style={styles.bookText}>Tahun: {item.year}</Text>
            <Text style={styles.bookText}>Genre: {item.genre}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteBook(item.id)}
            >
              <Text style={styles.deleteButtonText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Tambah Buku</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Buku</Text>

            <TouchableOpacity style={styles.inputButton}>
              <Text style={styles.inputLabel}>Judul:</Text>
              <TextInput
                style={styles.inputInsideButton}
                placeholder="Masukkan judul buku"
                value={newBook.title}
                onChangeText={(text) =>
                  setNewBook({ ...newBook, title: text })
                }
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputButton}>
              <Text style={styles.inputLabel}>Penulis:</Text>
              <TextInput
                style={styles.inputInsideButton}
                placeholder="Masukkan nama penulis"
                value={newBook.author}
                onChangeText={(text) =>
                  setNewBook({ ...newBook, author: text })
                }
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputButton}>
              <Text style={styles.inputLabel}>Tahun:</Text>
              <TextInput
                style={styles.inputInsideButton}
                placeholder="Masukkan tahun terbit"
                keyboardType="numeric"
                value={newBook.year}
                onChangeText={(text) =>
                  setNewBook({ ...newBook, year: text })
                }
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputButton}>
              <Text style={styles.inputLabel}>Genre:</Text>
              <TextInput
                style={styles.inputInsideButton}
                placeholder="Masukkan genre buku"
                value={newBook.genre}
                onChangeText={(text) =>
                  setNewBook({ ...newBook, genre: text })
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddBook}
            >
              <Text style={styles.submitButtonText}>Tambah</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  bookCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    elevation: 2,
  },
  bookText: {
    fontSize: 16,
    marginBottom: 5,
  },
  addButton: {
    padding: 15,
    backgroundColor: '#97bf80',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 17,
    padding: 10,
    backgroundColor: '#943737',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 70,
  },
  inputInsideButton: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  submitButton: {
    padding: 15,
    backgroundColor: '#97bf80',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    backgroundColor: '#943737',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
