require 'logger'
require 'bundler/setup'
Bundler.require
require 'sinatra/reloader' if development?
require './models'
require 'dotenv/load'
require 'httparty'

Dotenv.load

before do
    response.headers["Access-Control-Allow-Origin"] = "*" # 必要に応じて制限する
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Accept, Authorization, Cache-Control, X-Requested-With"
end

options "*" do
    200
end

get '/' do
    erb :index
end

get '/top' do
    erb :top
end

get '/edit' do
    erb :edit
end

get '/login' do
    erb :camera
end

post '/login', provides: :json do
    params = JSON.parse(request.body.read)
    name = params['name']
    place = params['place']
    password = params['password']

    place = Place.find_by(name: place)
    user = User.find_by(username: name, place: place)
    if user && user.password == password
        status 200
    else
        status 401
    end
end

post '/post', provides: :json do
    params = JSON.parse(request.body.read)
    name = params['name']
    placename = params['place']
    img_link = params['img_link']

    place = Place.find_by(name: placename)
    user = User.find_by(username: name, place: place)
    if user
        Post.create(user: user, img_link: img_link)
        status 200
    else
        status 401
    end
end

get '/posts/:place/:name' do
    placename = params['place']
    place = Place.find_by(name: placename)

    name = params['name']
    posts = Post.joins(:user).where(users: {place: place, username: name})
    return posts.to_json
end