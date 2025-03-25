=begin
Rackは、指定したファイルを独自のRuby DSLとして読み込み、
DSLで指定した様々なミドルウェア、アプリケーションを組み合わせて
Webサーバを立ち上げることができるrackupというコマンドを提供するライブラリ

rackupはRack::Server.start
=end

require 'bundler'
Bundler.require

Dotenv.load

Cloudinary.config do |config|
    config.cloud_name = ENV['CLOUD_NAME']
    config.api_key    = ENV['CLOUDINARY_API_KEY']
    config.api_secret = ENV['CLOUDINARY_API_SECRET']
end

require './app'
run Sinatra::Application
