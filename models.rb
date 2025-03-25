require 'bundler/setup'
Bundler.require

ActiveRecord::Base.establish_connection

class User < ActiveRecord::Base
    validates :username, presence: true
    has_many :posts
    belongs_to :place
end

class Place < ActiveRecord::Base
    has_many :users
end

class Post < ActiveRecord::Base
    belongs_to :user
    belongs_to :place
    validates :img_link, presence: true
end