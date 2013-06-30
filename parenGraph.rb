#!/usr/bin/env ruby

MESS_PER_PIX = 4
MAX_LEVEL = 49
PIX_SIZE = 4
WIDTH = 600
HEIGHT = 600

if ARGV.length != 1
	$stderr.puts "Usage: #{$0} filename"
	exit 1
end

class OTT
	def initialize chunk_size
		@cur = 0
		@cur_range = 0
		@ranges = Array.new
		@chunk_size = chunk_size
	end

	def addRange level, start, stop
		@ranges << { :level => level, :range => start..stop }
	end

	def max
		@ranges.last[:range].end
	end

	def next_avg
		tot = 0
		@chunk_size.times do |i|
			val = next_lvl

			if val == false
				return false if i == 0
				return tot / i
			end

			tot += val
		end

		return tot.to_f / @chunk_size.to_f
	end

	private
	def next_lvl
		return false if @cur_range >= @ranges.length

		@cur += 1
		@cur_range += 1 if @cur > @ranges[@cur_range][:range].end
		return false if @cur_range >= @ranges.length

		return @ranges[@cur_range][:level]
	end
end


# Retrieve ranges

ott = OTT.new MESS_PER_PIX

File.open ARGV[0], 'r' do |f|
	reg = /^(\d+) (\d+) (\d+)$/

	f.each_line do |l|
		m = reg.match l
		next if m.nil?

		ott.addRange m[1].to_i, m[2].to_i, m[3].to_i
	end
end


# Draw the image

require 'oily_png'

def get_color level
	return ChunkyPNG::Color::WHITE if level == 0

	normalized = (level.to_f * 510.0) / MAX_LEVEL.to_f

	if normalized <= 200
		val = (200.0 - normalized).round
		ChunkyPNG::Color.rgb 255, val, val
	else
		val = (255 - (normalized - 200)).round
		ChunkyPNG::Color.rgb val, 0, 0
	end
end

def draw_square img, x, y, size, color
	size.times do |i|
		size.times do |j|
			img[x+i, y+j] = color
		end
	end
end

NB_PIX = (ott.max.to_f / MESS_PER_PIX.to_f).ceil
img = ChunkyPNG::Image.new WIDTH, HEIGHT, ChunkyPNG::Color::BLACK

x = 0
y = 0
dir = 1
down = 0

NB_PIX.times do
	avg = ott.next_avg
	break if avg == false
	avg = avg.round

	col = get_color avg
	draw_square img, x, y, PIX_SIZE, col

	if x == 0 && y == 0
		x += PIX_SIZE * dir
	elsif x == WIDTH-PIX_SIZE && down == 0
		y += PIX_SIZE
		down = 1
	elsif x == WIDTH-PIX_SIZE && down == 1
		y += PIX_SIZE
		down = 2
		dir = -1
	elsif x == 0 && down == 0
		y += PIX_SIZE
		down = 1
	elsif x == 0 && down == 1
		y += PIX_SIZE
		down = 2
		dir = 1
	else
		x += PIX_SIZE * dir
		down = 0
	end
end

img.save 'parenGraph.png', :fast_rgb
