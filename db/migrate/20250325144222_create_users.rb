class CreateUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :users do |t|
      t.string :username
      t.string :password
      t.references :place, foreign_key: true
      t.timestamps
    end
  end
end