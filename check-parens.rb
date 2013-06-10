#!/usr/bin/env ruby
# coding: UTF-8

require 'restclient'
require 'nokogiri'

def parse content
	unmatched = 0

	content.children.each do |c|
		if c.element? && c.description.name != 'blockquote' && c.get_attribute('class') != 'codebox'
			parse c
		end

		if c.text?
			unmatched += findParens c.content
		end
	end

	return unmatched
end

def findParens str
	unmatched = 0

	str.each_char do |char|
		case char
		when '('
			$count += 1
		when ')'
			if $count > 0
				$count -= 1
			else
				unmatched += 1
			end
		else
			$totChars += 1
			$enclosedChars += 1 if $count > 0
		end
	end

	return unmatched
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

def puts str
	width = ENV['COLUMNS'].to_i > 0 ? ENV['COLUMNS'] : `tput cols`.to_i
	width = [width, 100].min

	print str
	(width - str.length).times do
		print ' '
	end

	print "\n"
end



$count = 0
msgId = ''

nbPages = 1
i = 0

f3 = IO.new 3, 'w' rescue nil
$totChars = 0
$enclosedChars = 0

while i < nbPages do
	tries = 0
	giving_up = false

	while true
		begin
			page = RestClient.get "http://fora.xkcd.com/viewtopic.php?f=7&t=101043&start=#{i*40}"
			break
		rescue RestClient::RequestTimeout
			$stderr.puts "Timeout while getting page #{i+1}. Open paren count is #{$count}"
			tries += 1
			if tries == 5
				giving_up = true
				break
			else
				sleep 3
				next
			end
		end
	end

	if giving_up
		$stderr.puts "Giving up."
		break
	end

	if page.code != 200
		$stderr.puts "Failed to get page #{i+1}. Open paren count is #{$count}."
		break
	end

	nbPages = page.match('Page <strong>\d+</strong> of <strong>(\d+)</strong>')[1].to_i

	updateProgressMeter i, nbPages

	doc = Nokogiri::HTML(page)

	postCount = 0
	savedCount = $count

	doc.css('.postbody').each do |msg|
		msgId = msg.parent.parent.get_attribute('id')
		msgContent = msg.css('.content').first
		postCount += 1

		unmatched = parse msgContent
		if unmatched > 0
			puts "#{unmatched} unmatched close parenthesis in newpage #{i+1}, post #{msgId}"
		end
	end

	if postCount != 40 && i < nbPages - 1
		$stderr.puts "Retrieved only #{postCount} from page #{i+1}. Open paren count was #{savedCount} before this page."
		break
	end

	i += 1
end

if $count > 1
	puts "There are #{$count} unmatched open parens."
elsif $count == 1
	puts "There is #{$count} unmatched open paren."
else
	puts "All open parens have been closed!"
end

puts "Last post was #{msgId}"

updateProgressMeter nbPages, nbPages
print "\n"

if not f3.nil?
	percent = (100 * $enclosedChars.to_f / $totChars.to_f).round 2
	f3.puts "#{percent}% of the OTT is enclosed in parenthesis (#{$enclosedChars} out of #{$totChars} characters)."
end
