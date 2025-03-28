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

  # 1) 現在の Layoutレコードを取得
  existing_layouts = user.layouts.to_a  # => [Layout, Layout, ...]

  # 2) 新しくクライアントから送られた layout_id の一覧
  incoming_ids = layout_array.map { |item| item['layout_id'] }.compact

  # 3) 既存のレイアウトで incoming_ids に含まれていないものは削除
  existing_layouts.each do |layout_record|
    unless incoming_ids.include?(layout_record.id)
      if layout_record.item_type == "photo"
        post = Post.find_by(id: layout_record.target_id)
        post.destroy if post
      end
      layout_record.destroy
    end
  end

  # 4) layout_array をもとに、既存を更新 or 新規作成
  layout_array.each do |item|
    layout_id = item['layout_id']
    if layout_id
      # 既存の可能性がある
      layout_record = Layout.find_by(id: layout_id, user_id: user.id)
      if layout_record
        # 更新
        layout_record.x     = item['x']
        layout_record.y     = item['y']
        layout_record.width = item['width']
        layout_record.angle = item['angle']
        layout_record.save
        next
      end
    end
    # layout_id が無い or 該当なし => 新規作成
    Layout.create!(
      user_id:   user.id,
      item_type: item['type'],
      target_id: item['id'],
      x:         item['x'],
      y:         item['y'],
      width:     item['width'],
      angle:     item['angle']
    )
  end

  status 200
end

get '/album/:username' do
  username = params['username']
  user = User.find_by(username: username)
  return { layout: [] }.to_json if user.nil?

  # 1) ユーザーに紐づく Layout レコードを取得
  layouts = user.layouts.order(:id).to_a

  # 2) Layout から、写真の場合の target_id を抽出
  layout_post_ids = layouts.select { |l| l.item_type == "photo" }.map(&:target_id)

  # 3) 既存レイアウトとして返すデータ
  layout_data = layouts.map do |l|
    if l.item_type == "photo"
      post_obj = Post.find_by(id: l.target_id)
      {
        layout_id: l.id,
        type: "photo",
        id: l.target_id,
        img_link: post_obj&.img_link,
        x: l.x,
        y: l.y,
        width: l.width,
        angle: l.angle
      }
    else
      {
        layout_id: l.id,
        type: "stamp",
        id: l.target_id,
        img_link: nil,
        x: l.x,
        y: l.y,
        width: l.width,
        angle: l.angle
      }
    end
  end

  # 4) ユーザーが投稿したが Layout に含まれていない写真を取得
  additional_posts = user.posts.where.not(id: layout_post_ids)
  additional_layout_data = additional_posts.map do |post_obj|
    {
      layout_id: -1,
      type: "photo",
      id: post_obj.id,
      img_link: post_obj.img_link,
      x: 0,      # デフォルトの位置
      y: 0,
      width: 200, # デフォルトの大きさ
      angle: 0
    }
  end

  # 5) 既存のレイアウトデータと追加分をマージして返す
  full_layout_data = layout_data + additional_layout_data
  { layout: full_layout_data }.to_json
end
