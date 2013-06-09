#!/usr/bin/env ruby
# coding: UTF-8

require 'restclient'
require 'nokogiri'

def parse content, page, id
	content.children.each do |c|
		if c.element? && c.description.name != 'blockquote'
			parse c, page, id
		end

		if c.text?
			findParens c.content, page, id
		end
	end
end

def findParens str, page, id
	str.each_char do |char|
		case char
		when '('
			$count += 1
		when ')'
			if $count > 0
				$count -= 1
			else
				puts "Unmatched close paren in newpage #{page}, post #{id}"
			end
		end
	end
end



def updateProgressMeter i, total
	width = ENV['COLUMNS'].to_i > 0 ? ENV['COLUMNS'] : `tput cols`.to_i
	width = [width, 100].min

	barWidth = width - (total.to_s.length * 2) - 7
	if barWidth >= 3
		completed = barWidth * i / total

		$stderr.print '|'

		completed.times do |i|
			if i < completed-1
				$stderr.print '='
			else
				$stderr.print '>'
			end
		end

		(barWidth-completed).times do
			$stderr.print ' '
		end

		$stderr.print "|  #{i} / #{total}\r"
	end
end



$count = 0

nbPages = 10

nbPages.times do |i|
	updateProgressMeter i, nbPages

	page = RestClient.get "http://fora.xkcd.com/viewtopic.php?f=7&t=101043&start=#{i*40}"

	if page.code != 200
		$stderr.puts "Failed to get page #{i+1}. Open paren count is #{$count}."
		break
	end

	doc = Nokogiri::HTML(page)

	postCount = 0
	savedCount = $count

	doc.css('.postbody').each do |msg|
		msgId = msg.parent.parent.get_attribute('id')
		msgContent = msg.css('.content').first
		postCount += 1

		parse msgContent, i+1, msgId
	end

	if postCount != 40
		$stderr.puts "Retrieved only #{postCount} from page #{i+1}. Open paren count was #{savedCount} before this page."
		break
	end
end

if $count > 0
	puts "There are #{$count} unmatched open parens."
else
	puts "All open parens have been closed!"
end

updateProgressMeter nbPages, nbPages
