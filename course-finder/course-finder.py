#!/usr/bin/env python3
from urllib.request import urlopen
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import List, Union
import sys
import re
import pprint


@dataclass
class PrereqCourse:
    code: str


@dataclass
class PrereqEither:
    codes: List[str]


@dataclass
class PrereqCredits:
    credits: float


@dataclass
class PrereqDeptCredits:
    credits: float
    level: int
    dept: str


@dataclass
class PrereqPermission:
    pass


@dataclass
class Course:
    code: str
    prereqs: List[Union[PrereqCourse, PrereqCredits,
                        PrereqDeptCredits, PrereqEither, PrereqPermission]]


class Scraper:
    pCourse = re.compile("(\w{3}\d{3}\w\d)")
    pCredits = re.compile("A minimum of (\d\.\d) credits")
    pDeptCredits = re.compile(
        "At least (\w+) (\d)\d{2}-level (\w{3}) half-courses")
    pPermission = re.compile("permission", re.IGNORECASE)

    def search(self) -> List[Course]:
        page = urlopen(
            "https://student.utm.utoronto.ca/timetable/timetable?subjectarea=7&session=20219")
        soup = BeautifulSoup(page.read(), features="lxml")

        courses = {}

        for course in soup.select(".course"):
            prereqs = self.parsePrereqs(course)
            code = self.pCourse.match(course.select_one("div h4").text)[1]
            courses[code] = Course(code, prereqs)

        return courses.values()

    def parsePrereqs(self, doc) -> list:
        rawPrereqs = self.siblingText(
            doc, "Prerequisites: ").split(" and ")

        if not rawPrereqs[0]:
            return []

        prereqs = []

        for rawPrereq in rawPrereqs:
            if bool(self.pCourse.search(rawPrereq)):
                m = self.pCourse.search(rawPrereq)
                code = self.pCourse.match(doc.select_one("div h4").text)[1]

                prereqs.append(PrereqCourse(m[1]))
            elif rawPrereq[0] == "(" and rawPrereq[-1] == ")":
                prereqs.append(PrereqEither(rawPrereq[1:-1].split(" or ")))
            elif bool(self.pCredits.match(rawPrereq)):
                prereqs.append(PrereqCredits(
                    float(self.pCredits.match(rawPrereq)[1])))
            elif bool(self.pDeptCredits.match(rawPrereq)):
                m = self.pDeptCredits.match(rawPrereq)

                prereqs.append(PrereqDeptCredits(
                    self.wordToNum(m[1]), m[2], m[3]))
            elif bool(self.pPermission.match(rawPrereq)):
                prereqs.append(PrereqPermission())

        return prereqs

    @staticmethod
    def wordToNum(word: str) -> float:
        if word == "one":
            return 1
        if word == "two":
            return 2
        if word == "three":
            return 3

        return 99

    @staticmethod
    def siblingText(doc, title) -> str:
        for element in doc.select("strong"):
            if element.text == title:
                return element.nextSibling

        return ""


class CourseFinder:
    coursesTaken: List[str]
    credits: float = 0

    def __init__(self, coursesTaken: List[str]):
        self.coursesTaken = coursesTaken

        for course in coursesTaken:
            self.credits += 1 if course[-1] == "Y" else 0.5

    def search(self) -> List[Course]:
        courses = []

        for course in Scraper().search():
            skip = False

            for prereq in course.prereqs:
                if type(prereq) is PrereqCourse and prereq.code not in self.coursesTaken:
                    skip = True
                elif type(prereq) is PrereqDeptCredits:
                    credits = 0

                    for course in self.coursesTaken:
                        if course[0:3] == prereq.dept:
                            credits += 1 if course[-1] == "Y" else 0.5

                    if credits < prereq.credits:
                        skip = True
                elif type(prereq) is PrereqCredits:
                    credits = 0

                    for course in self.coursesTaken:
                        credits += 1 if course == "Y" else 0.5

                    if credits < prereq.credits:
                        skip = True

            if not skip:
                courses.append(course)

        return courses


pp = pprint.PrettyPrinter(indent=4)
pp.pprint(CourseFinder(sys.argv[1:]).search())
