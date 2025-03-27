# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2025_03_27_140747) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "layouts", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "item_type"
    t.integer "target_id"
    t.integer "x"
    t.integer "y"
    t.integer "width"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "angle"
  end

  create_table "places", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "posts", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "place_id"
    t.string "img_link"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "theme_id"
    t.index ["place_id"], name: "index_posts_on_place_id"
    t.index ["theme_id"], name: "index_posts_on_theme_id"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "themes", force: :cascade do |t|
    t.string "name"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.string "password"
    t.bigint "place_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["place_id"], name: "index_users_on_place_id"
  end

  add_foreign_key "posts", "places"
  add_foreign_key "posts", "themes"
  add_foreign_key "posts", "users"
  add_foreign_key "users", "places"
end
