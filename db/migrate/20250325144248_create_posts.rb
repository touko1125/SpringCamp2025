class CreatePosts < ActiveRecord::Migration[6.1]
  def change
    create_table :posts do |t|
      t.references :user, foreign_key: true
      t.references :place, foreign_key: true
      t.string :img_link
      t.timestamps
    end
  end
end