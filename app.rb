require 'logger'
require 'bundler/setup'
Bundler.require
require 'sinatra/reloader' if development?
require './models'
require 'dotenv/load'
require 'httparty'

Dotenv.load

before do
  response.headers["Access-Control-Allow-Origin"] = "*"
  response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type, Accept, Authorization, Cache-Control, X-Requested-With"
end

options "*" do
  200
end

get '/' do
  erb :index
end

get '/post' do
  erb :post
end

# ログイン（既存）
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

# 通常の写真投稿（既存）
post '/post', provides: :json do
  params = JSON.parse(request.body.read)
  name = params['name']
  placename = params['place']
  themeid = params['theme']
  img_link = params['img_link']

  place = Place.find_by(name: placename)
  user = User.find_by(username: name, place: place)

  if user
    theme = Theme.find_by(id: themeid)
    Post.create!(user: user, place: place , theme: theme, img_link: img_link)
    status 200
  else
    status 401
  end
  return { name: name, place: placename, theme: themeid, img_link: img_link }.to_json
end

# レイアウト付きアルバム投稿 (新規) 
# JSから '/post/albumn' (あるいは '/post/album')に {name, place, img_link, layout} が送られる
post '/post/albumn', provides: :json do
  data = JSON.parse(request.body.read)
  name = data['name']
  placename = data['place']
  layout_array = data['layout']  # [{type, id, x, y, width}, ...]

  # ユーザ確認
  place = Place.find_by(name: placename)
  user = User.find_by(username: name, place: place)
  unless user
    status 401
    return
  end

  # 2) layout情報を保存
  #   送られてくる item[:type], item[:id], item[:x], item[:y], item[:width] を Layout に書き込む
  layout_array.each do |item|
    Layout.create(
      user_id:   user.id,
      item_type: item['type'],    # "photo"/"stamp"
      target_id: item['id'],
      x:         item['x'],
      y:         item['y'],
      width:     item['width']
    )
  end

  status 200
end

get '/album/:username' do
    username = params['username']
    user = User.find_by(username: username)
    if user.nil?
      return { layout: [] }.to_json
    end
  
    # Layoutレコードを取得
    layouts = user.layouts.order(:id)  # 順番はお好みで
  
    if layouts.any?
      # 既に Layout テーブルに情報がある場合
      layout_data = layouts.map do |l|
        if l.item_type == "photo"
          post_obj = Post.find_by(id: l.target_id)
          {
            type:  "photo",
            id:    l.target_id,
            img_link: post_obj&.img_link,
            x:     l.x,
            y:     l.y,
            width: l.width
          }
        else
          # stamp
          {
            type:  "stamp",
            id:    l.target_id,
            img_link: nil,  # stamp の場合、クライアント側でパスを補完
            x:     l.x,
            y:     l.y,
            width: l.width
          }
        end
      end
      { layout: layout_data }.to_json
  
    else
      # Layoutテーブルが空の場合 → postsテーブルから投稿を取得し、デフォルト座標で返す
      posts = user.posts
      layout_data = posts.map do |post_obj|
        {
          type:  "photo",
          id:    post_obj.id,
          img_link: post_obj.img_link,
          x:     0,      # デフォルトの位置
          y:     0,
          width: 200     # デフォルトの大きさ
        }
      end
      { layout: layout_data }.to_json
    end
  end