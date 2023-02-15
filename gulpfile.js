// Create gulp
// Переменные для билда и рабочей папки
let project_folder = 'build',
	source_folder = 'src';

// Поочередность подключения стилей
const stylePath = [
	source_folder + '/scss/**/normalize.scss',
	source_folder + '/scss/**/fonts.scss',
	source_folder + '/scss/**/main.scss',
	source_folder + '/scss/**/*.css',
	source_folder + '/scss/**/*.scss',
];
// Поочередность подключения скриптов
const scriptPath = [
	source_folder + '/js/**/jquery.js',
	source_folder + '/libs/**/*.js',
	source_folder + '/js/**/main.js',
	source_folder + '/js/**/*.js',
];

// Пути
let path = {
	build: {
		html: project_folder + '/',
		css: project_folder + '/css/',
		js: project_folder + '/js/',
		img: project_folder + '/img/',
		fonts: project_folder + '/fonts/',
	},
	src: {
		html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
		css: stylePath,
		js: scriptPath,
		img: source_folder + '/img/**/*.{jpg,JPG,png,svg,ico,webp}',
		fonts: source_folder + '/fonts/*.ttf',
	},
	watch: {
		html: source_folder + '/**/*.html',
		css: source_folder + '/scss/**/*.scss',
		js: source_folder + '/js/**/*.js',
		img: source_folder + '/img/**/*.{jpg,png,svg,ico,webp}',
	},
	clean: './' + project_folder + '/',
};

const { src, dest } = require('gulp'),
	gulp = require('gulp'),
	babel = require('gulp-babel'), // Кроссбраузерность JS
	concat = require('gulp-concat'), // Объединение файлов
	autoprefixer = require('gulp-autoprefixer'), // Префиксы
	htmlmin = require('gulp-htmlmin'), // Оптимизация html
	clean_css = require('gulp-clean-css'), // Оптимизация стилей
	uglify = require('gulp-uglify-es').default, // Оптимизация скриптов
	del = require('del'), // Удаление файлов
	browsersync = require('browser-sync').create(), // Синхронизация с браузером
	sourcemaps = require('gulp-sourcemaps'), // Просмотр не сжатого кода в dev tools
	scss = require('gulp-sass'), // Sass препроцессор
	imagemin = require('gulp-imagemin'), // Сжатие изображений
	jpegrecompress = require('imagemin-jpeg-recompress'), // Сжатие jpeg
	pngquant = require('imagemin-pngquant'), // Сжатие png
	webp = require('gulp-webp'), // Конвертирует в webp
	webphtml = require('gulp-webp-html'), // Конвертирует тег img в конструкцию picture
	rename = require('gulp-rename'), // Переименовывание файлов
	group_media = require('gulp-group-css-media-queries'), // Обьеденение медиа запросов
	plumber = require('gulp-plumber'), // Поиск ошибок
	notify = require('gulp-notify'), // Вывод ошибок
	cache = require('gulp-cache'), // Модуль для кэширования
	bourbon = require('node-bourbon'), // Модуль миксинов bourbon
	ttf2woff = require('gulp-ttf2woff'), // Из ttf2 конвертирует в woff
	ttf2woff2 = require('gulp-ttf2woff2'), // Из ttf2 конвертирует в woff2
	fonter = require('gulp-fonter'), // Конвертирует шрифты
	fileinclude = require('gulp-file-include'); // Шаблонизатор для html

function browserSync(params) {
	browsersync.init({
		server: {
			baseDir: './' + project_folder + '/',
		},
		port: 3000,
		notify: false,
	});
}

function html() {
	return (
		src(path.src.html)
			//Собираем файлы html
			.pipe(fileinclude())
			.pipe(
				htmlmin({
					collapseWhitespace: true,
					removeComments: true,
				})
			)
			.pipe(webphtml())
			.pipe(dest(path.build.html))
			.pipe(browsersync.stream())
	);
}

function css() {
	return (
		src(path.src.css)
			.pipe(concat('style.css'))
			// Проверка на ошибки
			.pipe(
				plumber({
					errorHandler: notify.onError({
						title: 'Styles',
						message: 'Error: <%= error.message %>',
					}),
				})
			)
			.pipe(
				scss({
					outputStyle: 'expanded',
				})
			)
			.pipe(group_media())
			.pipe(
				autoprefixer({
					overrideBrowserslist: [
						'last 15 versions',
						'> 1%',
						'ie 8',
						'ie 7',
					],
					cascade: true,
				})
			)
			.pipe(dest(path.build.css))
			.pipe(sourcemaps.init())
			.pipe(
				clean_css(
					{ level: { 1: { specialComments: 0 } } },
					(details) => {
						console.log(
							`${details.name}: ${details.stats.originalSize}`
						);
						console.log(
							`${details.name}: ${details.stats.minifiedSize}`
						);
					}
				)
			)
			.pipe(
				rename({
					extname: '.min.css',
				})
			)
			.pipe(sourcemaps.write(''))

			.pipe(dest(path.build.css))
			.pipe(browsersync.stream())
	);
}

function js() {
	return (
		src(path.src.js)
			//Собираем файлы js
			.pipe(concat('main.js'))

			// Проверка на ошибки
			.pipe(
				plumber({
					errorHandler: notify.onError({
						title: 'Styles',
						message: 'Error: <%= error.message %>',
					}),
				})
			)
			.pipe(
				babel({
					presets: ['@babel/env'],
				})
			)
			//Выходная папка для js
			.pipe(dest(path.build.js))
			.pipe(sourcemaps.init())
			.pipe(uglify())
			.pipe(
				rename({
					extname: '.min.js',
				})
			)
			//Создание sourcemap
			.pipe(sourcemaps.write('.'))

			.pipe(dest(path.build.js))
			.pipe(browsersync.stream())
	);
}

function images() {
	return (
		src(path.src.img)
			.pipe(
				webp({
					quality: 70,
				})
			)
			.pipe(dest(path.build.img))
			.pipe(src(path.src.img))
			.pipe(
				cache(
					imagemin([
						imagemin.gifsicle({ interlaced: true }),
						jpegrecompress({
							progressive: true,
							max: 90,
							min: 80,
						}),
						pngquant(),
						imagemin.svgo({ plugins: [{ removeViewBox: false }] }),
					])
				)
			)
			//Выходная папка для img
			.pipe(dest(path.build.img))
			.pipe(browsersync.stream())
	);
}

function fonts() {
	return src(path.src.fonts).pipe(dest(path.build.fonts));
}

gulp.task('otf2ttf', function () {
	return src([source_folder + '/fonts/*.otf'])
		.pipe(
			fonter({
				format: ['ttf'],
			})
		)
		.pipe(dest(source_folder + '/fonts/'));
});

// очистка кэша
gulp.task('cache:clear', () => {
	cache.clearAll();
});

function watchFiles(params) {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

function clean(params) {
	return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
