#!/usr/bin/env ruby
require "bundler/inline"

gemfile do
  source "https://rubygems.org"
  gem "faraday"
  gem "nokogiri"
end

class CourseManager
  def initialize
    @conn = Faraday.new(
      url: "https://student.utm.utoronto.ca",
      headers: { "Cookie" => ARGV[0] }
    )
  end

  def all
    res = @conn.post("/CourseInfo/") do |req|
      req.body = {
        session_cd: nil,
        department_id: nil,
        search: 1
      }
    end

    doc = Nokogiri.HTML(res.body)
    doc.css(".request_history tbody tr").map do |row|
      course_data = {
        session: row.children[1].text,
        course_code: row.children[3].text,
        section_code: row.children[5].text,
        meeting_section: row.children[7].text,
        instructor: row.children[9].text,
        syllabus_download_id: row
                    .at_css("a")
                    .attr("href")
                    .split("=")[1]
      }

      Course.new(course_data, @conn)
    end
  end
end

class Course
  def initialize(data, conn)
    @session = data[:session]
    @course_code = data[:course_code]
    @section_code = data[:section_code]
    @meeting_section = data[:meeting_section]
    @syllabus_download_id = data[:syllabus_download_id]
    @conn = conn
  end

  def download_syllabus
    return if syllabus_exists

    res = @conn.get("/CourseInfo/fetch_file.php?id=#{@syllabus_download_id}")
    ext = res.headers["content-disposition"].split(".")[1]

    File.open("courses/#{syllabus_title}.#{ext}", "wb") { |f| f.write(res.body) }
    sleep(1)
  end

  def syllabus_exists
    Dir.glob("courses/#{syllabus_title}.*").size > 0
  end

  def syllabus_title
    "#{@session} - #{@course_code}#{@section_code} - #{@meeting_section}"
  end
end

manager = CourseManager.new
manager.all.each do |course|
  course.download_syllabus
rescue StandardError
  puts "some error: #{course}"
end
