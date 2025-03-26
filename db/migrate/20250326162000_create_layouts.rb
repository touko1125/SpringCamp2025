# db/migrate/xxx_create_layouts.rb
class CreateLayouts < ActiveRecord::Migration[6.1]
  def change
    create_table :layouts do |t|
      t.integer :user_id, null: false
      t.string  :item_type   # "photo" or "stamp"
      t.integer :target_id   # photo の場合は posts.id, stamp の場合は enum ID
      t.integer :x
      t.integer :y
      t.integer :width
      t.timestamps
    end
  end
end
