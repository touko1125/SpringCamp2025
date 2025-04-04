require 'bundler/setup'
Bundler.require

ActiveRecord::Base.establish_connection

class User < ActiveRecord::Base
    validates :username, presence: true
    has_many :posts
    has_many :layouts
    belongs_to :place
end

class Place < ActiveRecord::Base
    has_many :users
end

class Post < ActiveRecord::Base
    belongs_to :user
    belongs_to :place
    belongs_to :theme
    validates :img_link, presence: true
end

class Theme < ActiveRecord::Base
    has_many :posts
    validates :name, presence: true
end

class Layout < ActiveRecord::Base
    belongs_to :user
  end