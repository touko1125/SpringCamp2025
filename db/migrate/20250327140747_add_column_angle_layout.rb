class AddColumnAngleLayout < ActiveRecord::Migration[6.1]
  def change
    add_column :layouts, :angle, :integer
  end
end
