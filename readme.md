# Visualisasi Data Keuangan IWKZ
Web-App ini diimplementasi tanpa menggunakan JS Framework(VanillaJS) yang terdiri dari HTML, CSS dan JavaScript

## Project Structure
- index.html: main html file, JS File diletakkan dipaling bawah & CSS paling atas di dalam tag `<head>`. Pisahkan component dengan comment sebagai contoh 
```
<!-- Content Progress Income -->
<div> ....implementasi component... </div>
```
- CSS: semua CSS dari library dimasukan kedalam sini. File `custom.css` digunakan untuk mengimplementasi custom css
- images: semua images masukan kedalam sini
- JS: JavaScript File masukan kedalam sini. `config.js` tempat static variable sebagai contoh API_URL, API_TOKEN, dll
- vendor: file library

## Tech Stack & Libraries
- [SB-Admin 2](https://github.com/BlackrockDigital/startbootstrap-sb-admin-2)
: basic layout / theme munggunakan Bootstrap admin theme SB-Admin 2
- [JavaScript ES6](https://www.w3schools.com/js/js_es6.asp) 
: banyak browser sudah support JS ES6 sehingga memungkinkan menulis JavaScript dengan style yang berbeda contohnya menggunakan Class. Ketika ingin memasukan JS dengan ES6 harus memasukan attribute type="module" pada tag script. contoh 
`<script src="js/app.js" type="module"></script>`
- [jQuery](https://www.w3schools.com/jquery/)
: JS Library ini digunakan untuk Document Object Model (DOM)
- [Countup](https://inorganik.github.io/countUp.js/)
: animasi untuk perubahan angka
- [Axios](https://github.com/axios/axios)
: API Client
- [CanvasJS](https://canvasjs.com/javascript-charts/)
: menampilkan chart & graph

## Implemented Features
- Menampilkan presentasi pemasukan beserta totalnya
- Chart pemasukan & pengeluaran
- Donate Paypal
- Websocket client dengan sockjs & stomp

## [Tickets](https://gitlab.com/IWKZ/dashboard/issues)
