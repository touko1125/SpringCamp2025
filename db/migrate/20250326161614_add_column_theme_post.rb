class AddColumnThemePost < ActiveRecord::Migration[6.1]
  def change
    add_reference :posts, :theme, foreign_key: true
  end
end
