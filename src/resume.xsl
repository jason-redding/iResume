<?xml version="1.0" encoding="UTF-8"?>
<!--
Copyright (C) 2017 Jason Redding

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->
<xsl:stylesheet version="1.0"
	xmlns="http://www.w3.org/1999/xhtml"
	xmlns:h="http://www.w3.org/1999/xhtml"
	xmlns:r="http://jman.socialis.dev/xsd/resume"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	exclude-result-prefixes="xsl h r">
	<xsl:preserve-space elements="*"/>
	<xsl:output method="xml" encoding="utf-8" indent="yes" omit-xml-declaration="yes"/>
	<xsl:param name="author-name" select="'1'"/>
	<xsl:param name="employer-sort" select="'descending'"/>
	<xsl:param name="position-sort" select="'descending'"/>
	<xsl:param name="system-date">
		<xsl:if test="count(/r:resume[@last-modified]) > 0 and string-length(/r:resume/@last-modified) > 0">
			<xsl:value-of select="/r:resume/@last-modified"/>
		</xsl:if>
	</xsl:param>
	<xsl:param name="show-projects" select="'0'"/>
	<xsl:param name="skills-layout" select="''"/>
	<xsl:param name="author-layout" select="''"/>
	<xsl:param name="projects-layout" select="''"/>
	<xsl:key name="level" match="/r:resume/r:meta/r:skill/r:levels/r:level" use="@value"/>
	<xsl:key name="category" match="/r:resume/r:meta/r:skill/r:categories/r:category" use="@value"/>
	<xsl:key name="skill" match="/r:resume/r:skills/r:skill" use="translate(normalize-space(r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-')"/>
	<xsl:variable name="max-level">
		<xsl:for-each select="/r:resume/r:meta/r:skill/r:levels/r:level">
			<xsl:sort select="@value" data-type="number" order="descending"/>
			<xsl:if test="position() = 1">
				<xsl:value-of select="@value"/>
			</xsl:if>
		</xsl:for-each>
	</xsl:variable>

	<xsl:template match="/r:resume">
		<xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;&#10;</xsl:text>
		<html>
			<head>
				<meta charset="utf-8"/>
				<xsl:element name="meta">
					<xsl:attribute name="http-equiv">
						<xsl:text>X-UA-Compatible</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="content">
						<xsl:text>IE=edge</xsl:text>
					</xsl:attribute>
				</xsl:element>
				<meta name="viewport" content="width=device-width, initial-scale=1"/>
				<title>resume.xml -> resume.xsl -> resume.xhtml</title>
				<link type="text/css" rel="stylesheet" href="/css/resume.css"/>
				<link type="text/css" rel="stylesheet" href="/css/resume-print.css" media="print"/>
			</head>
			<body>
				<div class="page-wrapper ui-helper-clearfix">
					<header class="header">
						<div class="author">
							<xsl:apply-templates select="r:author"/>
						</div>
					</header>
					<main>
						<div class="main-inner">
							<xsl:apply-templates select="*[not(local-name(self::*) = 'author' or local-name(self::*) = 'meta')]"/>
						</div>
					</main>
				</div>
			</body>
		</html>
	</xsl:template>

	<xsl:template name="handle-profile-author" match="r:author">
		<xsl:variable name="author-name" select="$author-name"/>
		<xsl:variable name="xml-author-layout" select="normalize-space(@layout)"/>
		<xsl:variable name="final-author-layout">
			<xsl:choose>
				<xsl:when test="string-length($author-layout) > 0">
					<xsl:value-of select="$author-layout"/>
				</xsl:when>
				<xsl:when test="string-length($xml-author-layout) > 0">
					<xsl:value-of select="$xml-author-layout"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="'split'"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:if test="$author-name = '1' or $author-name = 'yes' or $author-name = 'true' or $author-name = 'on'">
			<h1 class="author-name">
				<xsl:value-of select="normalize-space(@name)"/>
			</h1>
		</xsl:if>
		<xsl:if test="count(r:*[not(local-name() = 'split')]) > 0">
			<div class="author-contact">
				<xsl:if test="$final-author-layout = 'list' or count(r:split) = 0 or count(r:split/preceding-sibling::r:*) > 0">
					<div class="author-contact-left">
						<xsl:choose>
							<xsl:when test="$final-author-layout = 'list'">
								<xsl:for-each select="r:*[not(local-name() = 'split')]">
									<xsl:call-template name="list-author-info-item">
										<xsl:with-param name="node" select="."/>
									</xsl:call-template>
								</xsl:for-each>
							</xsl:when>
							<xsl:when test="count(r:split) > 0">
								<xsl:for-each select="r:split/preceding-sibling::r:*">
									<xsl:call-template name="list-author-info-item">
										<xsl:with-param name="node" select="."/>
									</xsl:call-template>
								</xsl:for-each>
							</xsl:when>
							<xsl:otherwise>
								<xsl:for-each select="r:*">
									<xsl:call-template name="list-author-info-item">
										<xsl:with-param name="node" select="."/>
									</xsl:call-template>
								</xsl:for-each>
							</xsl:otherwise>
						</xsl:choose>
					</div>
				</xsl:if>
				<xsl:if test="$final-author-layout = 'split' and count(r:split/following-sibling::r:*) > 0">
					<div class="author-contact-right">
						<xsl:for-each select="r:split/following-sibling::r:*">
							<xsl:call-template name="list-author-info-item">
								<xsl:with-param name="node" select="."/>
							</xsl:call-template>
						</xsl:for-each>
					</div>
				</xsl:if>
			</div>
		</xsl:if>
	</xsl:template>

	<xsl:template name="list-author-info-item">
		<xsl:param name="node" select="."/>
		<xsl:for-each select="$node">
			<xsl:variable name="element-type">
				<xsl:choose>
					<xsl:when test="local-name() = 'address' or local-name() = 'email' or local-name() = 'phone'">
						<xsl:value-of select="'a'"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="'div'"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:element name="div">
				<xsl:attribute name="class">
					<xsl:text>author-contact-info </xsl:text>
					<xsl:value-of select="concat('author-', local-name())"/>
				</xsl:attribute>
				<xsl:attribute name="data-contact-info-key">
					<xsl:value-of select="local-name()"/>
				</xsl:attribute>
				<xsl:if test="count(self::*[string-length(normalize-space(@label)) > 0]) > 0">
					<xsl:attribute name="data-contact-info-label">
						<xsl:value-of select="normalize-space(@label)"/>
					</xsl:attribute>
				</xsl:if>
				<xsl:choose>
					<xsl:when test="count(self::*[@label]) > 0">
						<xsl:if test="count(self::*[string-length(normalize-space(@label)) > 0]) > 0">
							<xsl:element name="div">
								<xsl:attribute name="class">
									<xsl:text>author-contact-info-label </xsl:text>
									<xsl:value-of select="concat('author-', local-name())"/>
								</xsl:attribute>
								<xsl:value-of select="normalize-space(@label)"/>
							</xsl:element>
						</xsl:if>
					</xsl:when>
				</xsl:choose>
				<xsl:element name="{$element-type}">
					<xsl:attribute name="class">
						<xsl:if test="$element-type = 'a'">
							<xsl:text>ui-link </xsl:text>
						</xsl:if>
						<xsl:text>author-contact-info-value </xsl:text>
						<xsl:value-of select="concat('author-', local-name())"/>
					</xsl:attribute>
					<xsl:attribute name="data-contact-info-key">
						<xsl:value-of select="local-name()"/>
					</xsl:attribute>
					<xsl:if test="count(self::*[string-length(normalize-space(@label)) > 0]) > 0">
						<xsl:attribute name="data-contact-info-label">
							<xsl:value-of select="normalize-space(@label)"/>
						</xsl:attribute>
					</xsl:if>
					<xsl:choose>
						<xsl:when test="local-name() = 'name'">
							<xsl:choose>
								<xsl:when test="string-length(normalize-space()) > 0">
									<xsl:value-of select="normalize-space()"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="normalize-space(ancestor::r:author/@name)"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:when test="local-name() = 'address'">
							<xsl:attribute name="href">
								<xsl:text>//maps.apple.com/?</xsl:text>
								<xsl:value-of select="concat('address=', normalize-space())"/>
							</xsl:attribute>
							<xsl:attribute name="target">
								<xsl:text>_blank</xsl:text>
							</xsl:attribute>
							<address>
								<xsl:value-of select="normalize-space()"/>
							</address>
						</xsl:when>
						<xsl:when test="local-name() = 'email'">
							<xsl:attribute name="href">
								<xsl:value-of select="concat('mailto:', normalize-space())"/>
								<xsl:text>?subject=iResume</xsl:text>
							</xsl:attribute>
							<xsl:call-template name="handle-html-within"/>
						</xsl:when>
						<xsl:when test="local-name() = 'phone'">
							<xsl:attribute name="href">
								<xsl:value-of select="concat('tel:', translate(normalize-space(), '-./', ''))"/>
							</xsl:attribute>
							<xsl:call-template name="handle-html-within"/>
						</xsl:when>
						<xsl:when test="local-name() = 'last-updated'">
							<xsl:choose>
								<xsl:when test="count(/r:resume[@last-modified]) > 0 and string-length(/r:resume/@last-modified) > 0">
									<xsl:variable name="last-modified-format">
										<xsl:choose>
											<xsl:when test="count(self::*[@format]) > 0">
												<xsl:value-of select="@format"/>
											</xsl:when>
											<xsl:otherwise>
												<xsl:value-of select="'MMMM d{th} yyyy'"/>
											</xsl:otherwise>
										</xsl:choose>
									</xsl:variable>
									<xsl:attribute name="data-date-format">
										<xsl:value-of select="$last-modified-format"/>
									</xsl:attribute>
									<xsl:call-template name="date-format">
										<xsl:with-param name="date" select="/r:resume/@last-modified"/>
										<xsl:with-param name="format" select="$last-modified-format"/>
									</xsl:call-template>
								</xsl:when>
							</xsl:choose>
						</xsl:when>
						<xsl:otherwise>
							<xsl:call-template name="handle-html-within"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:element>
			</xsl:element>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="handle-html-within">
		<xsl:for-each select="*|text()">
			<xsl:call-template name="handle-html"/>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="handle-profile-description" match="r:resume/r:description">
		<h2>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-heading'"/>
				<xsl:value-of select="' page-break-after-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-before)) > 0">
					<xsl:value-of select="concat(' page-break-before-', normalize-space(@break-before))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="string-length(normalize-space(@title)) > 0">
					<xsl:value-of select="@title"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>Description</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</h2>
		<div>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-content'"/>
				<xsl:value-of select="' page-break-before-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-after)) > 0">
					<xsl:value-of select="concat(' page-break-after-', normalize-space(@break-after))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:apply-templates mode="html"/>
		</div>
	</xsl:template>

	<xsl:template name="handle-competencies" match="r:competencies[count(r:competency) > 0]">
		<h2>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-heading'"/>
				<xsl:value-of select="' page-break-after-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-before)) > 0">
					<xsl:value-of select="concat(' page-break-before-', normalize-space(@break-before))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="string-length(normalize-space(@title)) > 0">
					<xsl:value-of select="@title"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>Competencies</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</h2>
		<div>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-content'"/>
				<xsl:value-of select="' page-break-before-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-after)) > 0">
					<xsl:value-of select="concat(' page-break-after-', normalize-space(@break-after))"/>
				</xsl:if>
			</xsl:attribute>
			<ul class="competency-list">
				<xsl:for-each select="r:competency">
					<li class="competency-item">
						<div class="competency">
							<xsl:attribute name="name">
								<xsl:value-of select="normalize-space(r:name)"/>
							</xsl:attribute>
							<div class="competency-name">
								<xsl:value-of select="normalize-space(r:name)"/>
							</div>
							<xsl:for-each select="r:duration">
								<div class="competency-duration">
									<xsl:call-template name="get-duration"/>
								</div>
							</xsl:for-each>
						</div>
					</li>
				</xsl:for-each>
			</ul>
		</div>
	</xsl:template>

	<xsl:template name="handle-skills" match="r:skills[count(r:skill) > 0]">
		<xsl:variable name="xml-skills-layout" select="normalize-space(self::r:skills/@layout)"/>
		<xsl:variable name="final-skills-layout">
			<xsl:choose>
				<xsl:when test="string-length($skills-layout) > 0">
					<xsl:value-of select="$skills-layout"/>
				</xsl:when>
				<xsl:when test="string-length($xml-skills-layout) > 0">
					<xsl:value-of select="$xml-skills-layout"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="'categories'"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<h2>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-heading'"/>
				<xsl:value-of select="' page-break-after-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-before)) > 0">
					<xsl:value-of select="concat(' page-break-before-', normalize-space(@break-before))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="string-length(normalize-space(@title)) > 0">
					<xsl:value-of select="@title"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>Skills</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</h2>
		<div>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-content'"/>
				<xsl:value-of select="' page-break-before-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-after)) > 0">
					<xsl:value-of select="concat(' page-break-after-', normalize-space(@break-after))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="$final-skills-layout = 'list'">
					<xsl:call-template name="render-skills-as-list"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="render-skills-as-categories"/>
				</xsl:otherwise>
			</xsl:choose>
		</div>
	</xsl:template>

	<xsl:template name="list-skills-in-category">
		<xsl:param name="skills" select="/r:resume/r:skills/r:skill"/>
		<xsl:param name="category-code" select="''"/>
		<xsl:param name="show-details" select="false()"/>
		<xsl:param name="min-skill-level" select="2"/>
		<xsl:variable name="category-name" select="normalize-space(/r:resume/r:meta/r:skill/r:categories/r:category[@value = $category-code])"/>
		<xsl:variable name="skills-in-category" select="$skills[r:level/@value >= $min-skill-level and count(r:categories/r:category[@value = $category-code]) > 0 and not(translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'true' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'yes' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'on' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '1')]"/>
		<xsl:variable name="skill-count" select="count($skills-in-category)"/>
		<xsl:variable name="is-category-visible" select="0 = count(/r:resume/r:meta/r:skill/r:categories/r:category[@value = $category-code and (translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'true' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'yes' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'on' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '1')])"/>
		<xsl:if test="$is-category-visible and $skill-count > 0">
			<span class="skill-category-name">
				<xsl:value-of select="concat($category-name, ': ')"/>
			</span>
			<span class="skills-grouped-by-category">
				<xsl:for-each select="$skills-in-category">
					<xsl:sort select="r:name" order="ascending"/>
					<xsl:sort select="r:level/@value" data-type="number" order="descending"/>
					<xsl:sort select="concat(r:experience/r:spanning[1]/@from, '_', r:experience/r:spanning[last()]/@to, '_', r:experience/r:since)" data-type="text" order="ascending"/>
					<xsl:if test="position() > 1">
						<xsl:text>, </xsl:text>
					</xsl:if>
					<xsl:call-template name="list-skill">
						<xsl:with-param name="show-details" select="$show-details"/>
					</xsl:call-template>
				</xsl:for-each>
			</span>
		</xsl:if>
	</xsl:template>

	<xsl:template name="render-skills-as-categories" match="r:skills" mode="categories">
		<xsl:param name="skills" select="r:skill"/>
		<xsl:param name="min-skill-level" select="2"/>
		<xsl:param name="show-details" select="false()"/>
		<ul class="skills as-categories">
			<xsl:for-each select="/r:resume/r:meta/r:skill/r:categories/r:category[not(translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'true' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'yes' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'on' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '1')]">
				<xsl:variable name="category-code" select="@value"/>
				<xsl:variable name="skills-in-category" select="$skills[r:level/@value >= $min-skill-level and count(r:categories/r:category[@value = $category-code and not(@value = 'relevant')]) > 0 and not(translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'true' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'yes' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'on' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '1')]"/>
				<xsl:variable name="skill-count" select="count($skills-in-category)"/>
				<xsl:if test="$skill-count > 0">
					<li>
						<xsl:call-template name="list-skills-in-category">
							<xsl:with-param name="skills" select="$skills"/>
							<xsl:with-param name="category-code" select="$category-code"/>
							<xsl:with-param name="min-skill-level" select="$min-skill-level"/>
							<xsl:with-param name="show-details" select="$show-details"/>
						</xsl:call-template>
					</li>
				</xsl:if>
			</xsl:for-each>
		</ul>
	</xsl:template>

	<xsl:template name="render-skills-as-list" match="r:skills" mode="list">
		<ul class="skills as-list">
			<xsl:for-each select="r:skill[not(translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'true' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'yes' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = 'on' or translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '1')]">
				<xsl:sort select="r:name" order="ascending"/>
				<xsl:sort select="r:level/@value" data-type="number" order="descending"/>
				<xsl:sort select="concat(r:experience/r:spanning[1]/@from, '_', r:experience/r:spanning[last()]/@to, '_', r:experience/r:since)" data-type="text" order="ascending"/>
				<xsl:variable name="skill-hidden-value" select="translate(normalize-space(@hidden), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')"/>
				<li class="skill-item">
					<xsl:call-template name="list-skill">
						<xsl:with-param name="show-details" select="false()"/>
					</xsl:call-template>
				</li>
			</xsl:for-each>
		</ul>
	</xsl:template>

	<xsl:template name="handle-employers" match="r:employers">
		<xsl:param name="employer-sort" select="$employer-sort"/>
		<xsl:param name="position-sort" select="$position-sort"/>
		<xsl:param name="show-projects" select="$show-projects"/>
		<h2>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-heading'"/>
				<xsl:value-of select="' page-break-after-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-before)) > 0">
					<xsl:value-of select="concat(' page-break-before-', normalize-space(@break-before))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="string-length(normalize-space(@title)) > 0">
					<xsl:value-of select="@title"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>Employers</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</h2>
		<div>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-content'"/>
				<xsl:value-of select="' page-break-before-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-after)) > 0">
					<xsl:value-of select="concat(' page-break-after-', normalize-space(@break-after))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="r:employer">
				<xsl:sort select="r:positions/r:position/r:timeline/r:start-date" data-type="text" order="{$employer-sort}"/>
				<xsl:sort select="r:positions/r:position/r:timeline/r:end-date" data-type="text" order="{$employer-sort}"/>
				<xsl:variable name="employer" select="."/>
				<xsl:for-each select="r:positions/r:position[not(@hidden = 'true' or @hidden = 'yes' or @hidden = 'on' or @hidden = '1')]">
					<xsl:sort select="r:timeline/r:start-date" data-type="text" order="{$position-sort}"/>
					<xsl:sort select="r:timeline/r:end-date" data-type="text" order="{$position-sort}"/>
					<div class="position-container">
						<a name="{concat('position-', normalize-space(r:timeline/r:start-date))}"></a>
						<div class="position-header">
							<div class="position-employer">
								<h3 class="employer-title">
									<xsl:value-of select="normalize-space($employer/r:title)"/>
								</h3>
								<div class="position-location">
									<xsl:call-template name="handle-position-location"/>
								</div>
							</div>
							<div class="position-info">
								<div class="position-title">
									<xsl:value-of select="normalize-space(r:title)"/>
								</div>
								<xsl:apply-templates select="r:timeline"/>
							</div>
						</div>
						<xsl:for-each select="r:description[not(@hidden = 'true' or @hidden = 'yes' or @hidden = 'on' or @hidden = '1')]">
							<div class="position-description">
								<xsl:apply-templates mode="html"/>
							</div>
						</xsl:for-each>
						<xsl:apply-templates select="r:stack"/>
						<xsl:if test="translate($show-projects, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz') = 'true' or translate($show-projects, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz') = 'yes' or translate($show-projects, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz') = 'on' or translate($show-projects, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz') = '1'">
							<xsl:apply-templates select="r:projects[not(@hidden = 'true' or @hidden = 'yes' or @hidden = 'on' or @hidden = '1')]"/>
						</xsl:if>
					</div>
				</xsl:for-each>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="handle-technology-stack" match="r:stack[count(r:skill) > 0]">
		<xsl:variable name="stack" select="."/>
		<xsl:if test="count($stack/r:skill) > 0">
			<div class="technology-stack-container">
				<span class="technology-stack-title">
					<xsl:value-of select="'Technology Stack: '"/>
				</span>
				<span class="technology-stack">
					<xsl:for-each select="$stack/r:skill">
						<xsl:sort select="key('skill', translate(normalize-space(@name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-'))/r:name" order="ascending" data-type="text"/>
						<xsl:if test="position() > 1">
							<xsl:text>, </xsl:text>
						</xsl:if>
						<xsl:call-template name="skill-ref">
							<xsl:with-param name="skill-ref" select="."/>
							<xsl:with-param name="use-original-text" select="true()"/>
						</xsl:call-template>
					</xsl:for-each>
				</span>
			</div>
		</xsl:if>
	</xsl:template>

	<xsl:template match="r:stack[count(r:skill) > 0]" mode="html">
		<xsl:call-template name="handle-technology-stack"/>
	</xsl:template>

	<xsl:template name="handle-projects" match="r:projects[not(@hidden = 'true' or @hidden = 'yes' or @hidden = 'on' or @hidden = '1')]">
		<xsl:variable name="projects" select="."/>
		<xsl:variable name="xml-projects-layout" select="normalize-space($projects/@layout)"/>
		<xsl:variable name="final-projects-layout">
			<xsl:choose>
				<xsl:when test="string-length($projects-layout) > 0">
					<xsl:value-of select="$projects-layout"/>
				</xsl:when>
				<xsl:when test="string-length($xml-projects-layout) > 0">
					<xsl:value-of select="$xml-projects-layout"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="'list'"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="is-layout-collapsible" select="$final-projects-layout = 'collapsible'"/>
		<!--<div class="projects-selector">
			<select id="project-selector" onchange="window.location = '#' + this[this.selectedIndex].value;">
				<option value="">- Jump to Project -</option>
				<xsl:for-each select="r:project">
					<xsl:sort select="r:title" data-type="text" order="ascending"/>
					<option>
						<xsl:attribute name="value">
							<xsl:value-of select="translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz')"/>
						</xsl:attribute>
						<xsl:value-of select="normalize-space(r:title)"/>
					</option>
				</xsl:for-each>
			</select>
		</div>-->
		<xsl:choose>
			<xsl:when test="count($projects/r:project[not(@hidden='true' or @hidden='1' or @hidden='yes' or @hidden='on')]) > 0">
				<div class="projects-container">
					<xsl:if test="$is-layout-collapsible">
						<xsl:attribute name="data-role">
							<xsl:value-of select="'collapsibleset'"/>
						</xsl:attribute>
						<xsl:attribute name="data-inset">
							<xsl:value-of select="'false'"/>
						</xsl:attribute>
					</xsl:if>
					<h4 class="projects-heading">
						<span class="projects-heading-text">
							<xsl:text>Projects</xsl:text>
						</span>
					</h4>
					<xsl:for-each select="$projects/r:project[not(@hidden='true' or @hidden='1' or @hidden='yes' or @hidden='on')]">
						<!--<xsl:variable name="has-title" select="count(r:title[not(@hidden = 'true' or @hidden = 'yes' or @hidden = 'on' or @hidden = '1')]) > 0 and string-length(normalize-space(r:title)) > 0"/>-->
						<xsl:if test="false() and not($is-layout-collapsible) and position() > 1">
							<hr/>
						</xsl:if>
						<div class="project-item">
							<xsl:if test="$is-layout-collapsible">
								<xsl:attribute name="data-role">
									<xsl:value-of select="'collapsible'"/>
								</xsl:attribute>
								<xsl:if test="count(self::r:project[@expanded]) > 0">
									<xsl:attribute name="data-collapsed">
										<xsl:choose>
											<xsl:when test="@expanded='true' or @expanded='yes' or @expanded='on' or @expanded='1'">
												<xsl:text>false</xsl:text>
											</xsl:when>
											<xsl:otherwise>
												<xsl:text>true</xsl:text>
											</xsl:otherwise>
										</xsl:choose>
									</xsl:attribute>
								</xsl:if>
							</xsl:if>
							<xsl:choose>
								<xsl:when test="$is-layout-collapsible">
									<xsl:apply-templates select="r:title"/>
								</xsl:when>
								<xsl:otherwise>
									<div class="project-heading">
										<xsl:apply-templates select="r:title"/>
										<xsl:call-template name="handle-project-link">
											<xsl:with-param name="node" select="r:link"/>
										</xsl:call-template>
									</div>
								</xsl:otherwise>
							</xsl:choose>
							<div class="project-description">
								<xsl:for-each select="r:description">
									<xsl:apply-templates mode="html"/>
								</xsl:for-each>
							</div>
							<xsl:apply-templates select="r:stack"/>
							<xsl:if test="$is-layout-collapsible">
								<xsl:call-template name="handle-project-link">
									<xsl:with-param name="node" select="r:link"/>
									<xsl:with-param name="rule" select="'before'"/>
								</xsl:call-template>
							</xsl:if>
						</div>
					</xsl:for-each>
				</div>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="handle-project-title" match="r:project/r:title">
		<xsl:param name="node" select="."/>
		<xsl:if test="count($node) > 0">
			<h5 class="project-title">
				<!--<a>
					<xsl:attribute name="name">
						<xsl:value-of select="translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz')"/>
					</xsl:attribute>
					<xsl:attribute name="href">
						<xsl:value-of select="concat('#', translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz'))"/>
					</xsl:attribute>
				</a>-->
				<span class="project-title-text">
					<xsl:value-of select="normalize-space($node)"/>
				</span>
			</h5>
		</xsl:if>
	</xsl:template>

	<xsl:template name="handle-project-link" match="r:project/r:link[string-length(normalize-space()) > 0]">
		<xsl:param name="node" select="."/>
		<xsl:param name="rule" select="''"/>
		<xsl:if test="count($node) > 0">
			<xsl:variable name="node-href">
				<xsl:choose>
					<xsl:when test="count($node/self::r:link[@href]) > 0">
						<xsl:value-of select="normalize-space($node/@href)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="normalize-space($node)"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="node-label">
				<xsl:choose>
					<xsl:when test="count($node/self::r:link[@label]) > 0">
						<xsl:value-of select="normalize-space($node/@label)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="'Project Link'"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:if test="$rule = 'before'">
				<hr/>
			</xsl:if>
			<span class="project-link">
				<span class="project-link-label">
					<xsl:value-of select="concat($node-label, ':')"/>
				</span>
				<xsl:text> </xsl:text>
				<a href="{$node-href}" target="_blank" class="project-link">
					<xsl:value-of select="normalize-space($node)"/>
				</a>
			</span>
			<xsl:if test="$rule = 'after'">
				<hr/>
			</xsl:if>
		</xsl:if>
	</xsl:template>

	<xsl:template name="handle-position-location">
		<xsl:param name="position" select="."/>
		<xsl:variable name="location-value">
			<xsl:choose>
				<xsl:when test="count($position/r:location) > 0">
					<xsl:value-of select="normalize-space($position/r:location)"/>
				</xsl:when>
				<xsl:when test="count(parent::r:positions/preceding-sibling::r:location) > 0">
					<xsl:value-of
						select="normalize-space($position/parent::r:positions/preceding-sibling::r:location)"/>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:if test="string-length($location-value) > 0">
			<xsl:value-of select="$location-value"/>
		</xsl:if>
	</xsl:template>

	<xsl:template name="handle-timeline" match="r:timeline">
		<div class="timeline-container">
			<span class="timeline-start">
				<xsl:for-each select="r:start-date">
					<xsl:call-template name="date-eval">
						<xsl:with-param name="symbolic" select="@symbolic"/>
						<xsl:with-param name="truncate-to" select="@truncate-to"/>
						<xsl:with-param name="format" select="@format"/>
					</xsl:call-template>
				</xsl:for-each>
			</span>
			<xsl:text> - </xsl:text>
			<span class="timeline-end">
				<xsl:choose>
					<xsl:when test="count(r:end-date) > 0">
						<xsl:for-each select="r:end-date">
							<xsl:call-template name="date-eval">
								<xsl:with-param name="symbolic" select="@symbolic"/>
								<xsl:with-param name="truncate-to" select="@truncate-to"/>
								<xsl:with-param name="format" select="@format"/>
							</xsl:call-template>
						</xsl:for-each>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>Present</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
			</span>
		</div>
	</xsl:template>

	<xsl:template name="handle-certifications" match="r:certifications[count(r:certificate) > 0]">
		<h2>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-heading'"/>
				<xsl:value-of select="' page-break-after-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-before)) > 0">
					<xsl:value-of select="concat(' page-break-before-', normalize-space(@break-before))"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="string-length(normalize-space(@title)) > 0">
					<xsl:value-of select="@title"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>Certifications</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</h2>
		<div>
			<xsl:attribute name="data-section">
				<xsl:value-of select="local-name()"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="'section-content'"/>
				<xsl:value-of select="' page-break-before-avoid'"/>
				<xsl:if test="string-length(normalize-space(@break-after)) > 0">
					<xsl:value-of select="concat(' page-break-after-', normalize-space(@break-after))"/>
				</xsl:if>
			</xsl:attribute>
			<ul class="certificate-list">
				<xsl:for-each select="r:certificate">
					<li class="certificate-item">
						<span class="certificate">
							<xsl:attribute name="data-name">
								<xsl:value-of select="normalize-space(r:name)"/>
							</xsl:attribute>
							<xsl:attribute name="data-issuer">
								<xsl:value-of select="normalize-space(r:issuer)"/>
							</xsl:attribute>
							<xsl:attribute name="data-issue-date">
								<xsl:value-of select="normalize-space(r:issue-date)"/>
							</xsl:attribute>
							<xsl:attribute name="data-issue-year">
								<xsl:call-template name="date-format">
									<xsl:with-param name="date" select="r:issue-date"/>
									<xsl:with-param name="format" select="'yyyy'"/>
								</xsl:call-template>
							</xsl:attribute>
							<xsl:if test="count(r:expire-date) > 0">
								<xsl:attribute name="data-expire-date">
									<xsl:value-of select="normalize-space(r:expire-date)"/>
								</xsl:attribute>
								<xsl:attribute name="data-expire-year">
									<xsl:call-template name="date-format">
										<xsl:with-param name="date" select="r:expire-date"/>
										<xsl:with-param name="format" select="'yyyy'"/>
									</xsl:call-template>
								</xsl:attribute>
							</xsl:if>
							<xsl:if test="count(r:score) > 0">
								<xsl:attribute name="data-score">
									<xsl:value-of select="normalize-space(r:score)"/>
								</xsl:attribute>
							</xsl:if>
							<xsl:if test="count(r:max-score) > 0">
								<xsl:attribute name="data-max-score">
									<xsl:value-of select="normalize-space(r:max-score)"/>
								</xsl:attribute>
							</xsl:if>
							<xsl:attribute name="title">
								<xsl:value-of select="normalize-space(r:name)"/>
							</xsl:attribute>
							<span class="text">
								<xsl:if
									test="count(r:issuer) > 0 and not(starts-with(normalize-space(r:name), normalize-space(r:issuer)))">
									<xsl:value-of select="normalize-space(r:issuer)"/>
									<xsl:text> </xsl:text>
								</xsl:if>
								<xsl:value-of select="normalize-space(r:name)"/>
							</span>
						</span>
					</li>
				</xsl:for-each>
			</ul>
		</div>
	</xsl:template>

	<xsl:template name="handle-skills-legend" match="r:skills-legend">
		<div class="skills-legend">
			<xsl:for-each select="/r:resume/r:meta/r:skill/r:levels/r:level">
				<div class="skills-legend-level">
					<div class="skills-legend-level-percentage">
						<xsl:value-of select="concat((@value div $max-level) * 100, '%')"/>
					</div>
					<div class="skills-legend-level-name">
						<xsl:value-of select="key('level', floor(@value))"/>
					</div>
				</div>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="handle-skill-experience" match="r:skill/r:experience">
		<xsl:param name="experience" select="."/>
		<xsl:variable name="nodes" select="$experience/r:spanning | $experience/r:since"/>
		<xsl:variable name="month-count">
			<xsl:call-template name="count-months">
				<xsl:with-param name="nodes" select="$nodes"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="$month-count"/>
	</xsl:template>

	<xsl:template name="count-months">
		<xsl:param name="nodes" select="."/>
		<xsl:param name="node-index" select="1"/>
		<xsl:param name="from-year" select="''"/>
		<xsl:param name="from-month" select="''"/>
		<xsl:param name="from-day" select="''"/>
		<xsl:param name="to-year" select="''"/>
		<xsl:param name="to-month" select="''"/>
		<xsl:param name="to-day" select="''"/>
		<xsl:param name="year" select="$from-year"/>
		<xsl:param name="month" select="$from-month"/>
		<xsl:param name="day" select="$from-day"/>
		<xsl:param name="month-count" select="0"/>

		<xsl:variable name="node" select="$nodes/self::*[$node-index]"/>

		<xsl:variable name="experience-from-date">
			<xsl:choose>
				<xsl:when test="local-name($node) = 'spanning'">
					<xsl:call-template name="date-format">
						<xsl:with-param name="format" select="'yyyy-MM-dd'"/>
						<xsl:with-param name="date">
							<xsl:value-of select="normalize-space($node/@from)"/>
						</xsl:with-param>
					</xsl:call-template>
				</xsl:when>
				<xsl:when test="local-name($node) = 'since'">
					<xsl:call-template name="date-format">
						<xsl:with-param name="format" select="'yyyy-MM-dd'"/>
						<xsl:with-param name="date">
							<xsl:value-of select="normalize-space($node)"/>
						</xsl:with-param>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="experience-to-date">
			<xsl:choose>
				<xsl:when test="local-name($node) = 'spanning'">
					<xsl:call-template name="date-format">
						<xsl:with-param name="format" select="'yyyy-MM-dd'"/>
						<xsl:with-param name="date">
							<xsl:value-of select="normalize-space($node/@to)"/>
						</xsl:with-param>
					</xsl:call-template>
				</xsl:when>
				<xsl:when test="local-name($node) = 'since'">
					<xsl:call-template name="date-format">
						<xsl:with-param name="format" select="'yyyy-MM-dd'"/>
						<xsl:with-param name="date">
							<xsl:choose>
								<xsl:when test="string-length($system-date) > 0">
									<xsl:value-of select="$system-date"/>
								</xsl:when>
								<xsl:when test="string-length(/r:resume/@last-modified) > 0">
									<xsl:value-of select="/r:resume/@last-modified"/>
								</xsl:when>
							</xsl:choose>
						</xsl:with-param>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="start-year">
			<xsl:choose>
				<xsl:when test="string-length($from-year) > 0">
					<xsl:value-of select="number($from-year)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="date-format">
						<xsl:with-param name="date">
							<xsl:value-of select="$experience-from-date"/>
						</xsl:with-param>
						<xsl:with-param name="format" select="'yyyy'"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="start-month">
			<xsl:choose>
				<xsl:when test="string-length($from-month) > 0">
					<xsl:value-of select="number($from-month)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="date-format">
						<xsl:with-param name="date">
							<xsl:value-of select="$experience-from-date"/>
						</xsl:with-param>
						<xsl:with-param name="format" select="'M'"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="start-day">
			<xsl:choose>
				<xsl:when test="string-length($from-day) > 0">
					<xsl:value-of select="number($from-day)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="date-format">
						<xsl:with-param name="date">
							<xsl:value-of select="$experience-from-date"/>
						</xsl:with-param>
						<xsl:with-param name="format" select="'d'"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="end-year">
			<xsl:choose>
				<xsl:when test="string-length($to-year) > 0">
					<xsl:value-of select="number($to-year)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="date-format">
						<xsl:with-param name="date">
							<xsl:value-of select="$experience-to-date"/>
						</xsl:with-param>
						<xsl:with-param name="format" select="'yyyy'"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="end-month">
			<xsl:choose>
				<xsl:when test="string-length($to-month) > 0">
					<xsl:value-of select="number($to-month)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="date-format">
						<xsl:with-param name="date">
							<xsl:value-of select="$experience-to-date"/>
						</xsl:with-param>
						<xsl:with-param name="format" select="'M'"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="end-day">
			<xsl:choose>
				<xsl:when test="string-length($to-day) > 0">
					<xsl:value-of select="number($to-day)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="date-format">
						<xsl:with-param name="date">
							<xsl:value-of select="$experience-to-date"/>
						</xsl:with-param>
						<xsl:with-param name="format" select="'d'"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="year-index">
			<xsl:choose>
				<xsl:when test="string-length($year) > 0">
					<xsl:value-of select="number($year)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="number($start-year)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="month-index">
			<xsl:choose>
				<xsl:when test="string-length($month) > 0">
					<xsl:value-of select="number($month)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="number($start-month)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="day-index">
			<xsl:choose>
				<xsl:when test="string-length($day) > 0">
					<xsl:value-of select="number($day)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="number($start-day)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="next-year">
			<xsl:choose>
				<xsl:when test="$month-index = 12">
					<xsl:value-of select="$year-index + 1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$year-index"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="next-month">
			<xsl:choose>
				<xsl:when test="$month-index = 12">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$month-index + 1"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:choose>
			<xsl:when test="$year-index &lt; $end-year or ($year-index = $end-year and $month-index &lt; $end-month)">
				<xsl:call-template name="count-months">
					<xsl:with-param name="nodes" select="$nodes"/>
					<xsl:with-param name="node-index" select="$node-index"/>
					<xsl:with-param name="from-year" select="$start-year"/>
					<xsl:with-param name="from-month" select="$start-month"/>
					<xsl:with-param name="from-day" select="$start-day"/>
					<xsl:with-param name="to-year" select="$end-year"/>
					<xsl:with-param name="to-month" select="$end-month"/>
					<xsl:with-param name="to-day" select="$end-day"/>
					<xsl:with-param name="year" select="$next-year"/>
					<xsl:with-param name="month" select="$next-month"/>
					<xsl:with-param name="day" select="$day-index"/>
					<xsl:with-param name="month-count" select="$month-count + 1"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$node-index &lt; count($nodes)">
				<xsl:call-template name="count-months">
					<xsl:with-param name="nodes" select="$nodes"/>
					<xsl:with-param name="node-index" select="$node-index + 1"/>
					<xsl:with-param name="from-year" select="$start-year"/>
					<xsl:with-param name="from-month" select="$start-month"/>
					<xsl:with-param name="from-day" select="$start-day"/>
					<xsl:with-param name="to-year" select="$end-year"/>
					<xsl:with-param name="to-month" select="$end-month"/>
					<xsl:with-param name="to-day" select="$end-day"/>
					<xsl:with-param name="year" select="$next-year"/>
					<xsl:with-param name="month" select="$next-month"/>
					<xsl:with-param name="day" select="$day-index"/>
					<xsl:with-param name="month-count" select="$month-count + 1"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$month-count"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="list-skill" match="r:skill">
		<xsl:param name="skill" select="."/>
		<xsl:param name="skill-text" select="normalize-space($skill/r:name)"/>
		<xsl:param name="show-details" select="false()"/>
		<xsl:variable name="experience-ongoing" select="count($skill/r:experience/r:since) > 0"/>
		<xsl:variable name="experience-span-count" select="count($skill/r:experience/r:spanning)"/>
		<xsl:variable name="earliest-span">
			<xsl:for-each select="$skill/r:experience/r:spanning">
				<xsl:sort data-type="text" select="@from" order="ascending"/>
				<xsl:if test="position() = 1">
					<xsl:value-of select="@from"/>
				</xsl:if>
			</xsl:for-each>
		</xsl:variable>
		<xsl:variable name="experience-since" select="normalize-space($skill/r:experience/r:since)"/>
		<xsl:variable name="experience-first">
			<xsl:choose>
				<xsl:when test="$experience-ongoing and $experience-span-count = 0">
					<xsl:value-of select="$experience-since"/>
				</xsl:when>
				<xsl:when test="$experience-ongoing and $experience-span-count > 0">
					<xsl:choose>
						<xsl:when test="$earliest-span &lt; $experience-since">
							<xsl:value-of select="$earliest-span"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$experience-since"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$earliest-span"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="experience-last">
			<xsl:choose>
				<xsl:when test="$experience-ongoing">
					<xsl:choose>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:when test="string-length(/r:resume/@last-modified) > 0">
							<xsl:value-of select="/r:resume/@last-modified"/>
						</xsl:when>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:for-each select="$skill/r:experience/r:spanning">
						<xsl:sort data-type="text" select="@to" order="descending"/>
						<xsl:if test="position() = 1">
							<xsl:value-of select="@to"/>
						</xsl:if>
					</xsl:for-each>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="experience-since-year">
			<xsl:call-template name="date-format">
				<xsl:with-param name="format" select="'yyyy'"/>
				<xsl:with-param name="date">
					<xsl:value-of select="$experience-first"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="experience-until-year">
			<xsl:call-template name="date-format">
				<xsl:with-param name="format" select="'yyyy'"/>
				<xsl:with-param name="date">
					<xsl:value-of select="$experience-last"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="skill-last-used">
			<xsl:call-template name="date-format">
				<xsl:with-param name="format" select="concat('MMMM', &quot;' of '&quot;, 'yyyy')"/>
				<xsl:with-param name="date">
					<xsl:value-of select="$experience-last"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="experience-years">
			<xsl:call-template name="get-duration">
				<xsl:with-param name="from-year">
					<xsl:value-of select="$experience-since-year"/>
				</xsl:with-param>
				<xsl:with-param name="to-year">
					<xsl:value-of select="$experience-until-year"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="skill-level" select="$skill/r:level/@value"/>
		<xsl:variable name="meta-skill-level" select="key('level', floor($skill-level))"/>
		<xsl:variable name="skill-level-preposition">
			<xsl:choose>
				<xsl:when test="count($meta-skill-level[@preposition]) > 0">
					<xsl:value-of select="normalize-space($meta-skill-level/@preposition)"/>
				</xsl:when>
				<xsl:when test="count(/r:resume/r:meta/r:skill/r:levels[@preposition]) > 0">
					<xsl:value-of select="normalize-space(/r:resume/r:meta/r:skill/r:levels/@preposition)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>at</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="skill-version">
			<xsl:value-of select="normalize-space($skill/r:version)"/>
		</xsl:variable>
		<xsl:variable name="skill-version-hint">
			<xsl:value-of select="normalize-space($skill/r:version/@hint)"/>
		</xsl:variable>
		<span class="skill">
			<xsl:attribute name="class">
				<xsl:text>skill skill-name</xsl:text>
				<xsl:value-of select="concat(' base-level-', floor($skill-level))"/>
				<xsl:if test="not($skill-level = floor($skill-level))">
					<xsl:value-of select="concat(' level-', $skill-level)"/>
				</xsl:if>
				<xsl:value-of select="concat(' experience-years-', $experience-years)"/>
				<xsl:for-each select="$skill/r:categories/r:category">
					<xsl:value-of select="concat(' category-', @value)"/>
				</xsl:for-each>
			</xsl:attribute>
			<xsl:attribute name="title">
				<!--<xsl:text>${level} ${level.preposition#default(levels.preposition)} ${name} with </xsl:text>-->
				<xsl:text>${experience.duration} of experience${experience.last#date("'&lt;br/>&lt;br/>Last used: 'MMMM' of 'yyyy")}</xsl:text>
			</xsl:attribute>
			<!--<xsl:attribute name="title">-->
			<!--<xsl:value-of select="normalize-space($meta-skill-level)"/>-->
			<!--<xsl:text> </xsl:text>-->
			<!--<xsl:value-of select="concat('(', ($skill-level div $max-level) *100, '%)')"/>-->
			<!--<xsl:text> </xsl:text>-->
			<!--<xsl:value-of select="$skill-level-preposition"/>-->
			<!--<xsl:text> </xsl:text>-->
			<!--<xsl:value-of select="normalize-space($skill/r:name)"/>-->
			<!--<xsl:text> with </xsl:text>-->
			<!--<xsl:value-of select="$experience-years"/>-->
			<!--<xsl:text> year</xsl:text>-->
			<!--<xsl:if test="not(number($experience-years) = 1)">-->
			<!--	<xsl:text>s</xsl:text>-->
			<!--</xsl:if>-->
			<!--<xsl:text> of experience</xsl:text>-->
			<!--<xsl:if test="not($experience-ongoing)">-->
			<!--	<xsl:text>&#10;&#10;</xsl:text>-->
			<!--	<xsl:value-of select="concat('Last used: ', $skill-last-used)"/>-->
			<!--</xsl:if>-->
			<!--<xsl:text>&#10;&#10;</xsl:text>
		<xsl:choose>
			<xsl:when test="count(r:categories/r:category) = 1">
				<xsl:text>Category: </xsl:text>
			</xsl:when>
			<xsl:when test="count(r:categories/r:category) > 1">
				<xsl:text>Categories: </xsl:text>
			</xsl:when>
		</xsl:choose>
		<xsl:for-each select="r:categories/r:category">
			<xsl:sort select="normalize-space(key('category', @value))" data-type="text" order="ascending"/>
			<xsl:if test="position() > 1">
				<xsl:text>, </xsl:text>
			</xsl:if>
			<xsl:value-of select="normalize-space(key('category', @value))"/>
			</xsl:for-each>-->
			<!--</xsl:attribute>-->
			<xsl:attribute name="data-name">
				<xsl:value-of select="normalize-space($skill/r:name)"/>
			</xsl:attribute>
			<xsl:attribute name="data-level-value">
				<xsl:value-of select="normalize-space($skill-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-level">
				<xsl:value-of select="normalize-space($meta-skill-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-level-percentage">
				<xsl:value-of select="($skill-level div $max-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-since">
				<xsl:value-of select="$experience-first"/>
			</xsl:attribute>
			<xsl:attribute name="data-until">
				<xsl:value-of select="$experience-last"/>
			</xsl:attribute>
			<xsl:attribute name="data-experience-precision">
				<xsl:if test="string-length($skill/r:experience/@precision) > 0">
					<xsl:value-of select="normalize-space($skill/r:experience/@precision)"/>
				</xsl:if>
			</xsl:attribute>
			<xsl:attribute name="data-experience-years">
				<xsl:value-of select="$experience-years"/>
			</xsl:attribute>
			<xsl:attribute name="data-experience-duration">
				<xsl:value-of select="concat('P', $experience-years, 'Y')"/>
			</xsl:attribute>
			<xsl:if test="string-length($skill-version) > 0">
				<xsl:attribute name="data-version">
					<xsl:value-of select="$skill-version"/>
				</xsl:attribute>
			</xsl:if>
			<xsl:if test="string-length($skill-version-hint) > 0">
				<xsl:attribute name="data-version-hint">
					<xsl:value-of select="$skill-version-hint"/>
				</xsl:attribute>
			</xsl:if>
			<xsl:attribute name="tabindex">
				<xsl:value-of select="0"/>
			</xsl:attribute>
			<span class="text">
				<!--<xsl:value-of select="normalize-space($skill/r:name)"/>-->
				<xsl:value-of select="$skill-text"/>
			</span>
			<xsl:if test="$show-details">
				<xsl:text> (</xsl:text>
				<!--<span class="skill-experience">-->
				<!--	<xsl:value-of select="concat($experience-years, ' yr')"/>-->
				<!--	<xsl:if test="not(number($experience-years) = 1)">-->
				<!--		<xsl:text>s</xsl:text>-->
				<!--	</xsl:if>-->
				<!--</span>-->
				<!--<xsl:text>, </xsl:text>-->
				<span class="skill-level">
					<xsl:value-of select="$meta-skill-level"/>
				</span>
				<xsl:text>)</xsl:text>
			</xsl:if>
		</span>
	</xsl:template>

	<xsl:template name="handle-html" match="h:*|text()" mode="html">
		<xsl:if test="count(self::*) > 0">
			<xsl:element name="{local-name()}">
				<xsl:apply-templates mode="html" select="@*"/>
				<xsl:apply-templates mode="html"/>
			</xsl:element>
		</xsl:if>
		<xsl:if test="count(self::text()) > 0">
			<xsl:call-template name="handle-text">
				<xsl:with-param name="text" select="."/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>

	<xsl:template name="get-duration" match="r:duration" mode="html">
		<xsl:param name="from-year">
			<xsl:if test="count(self::r:duration[@from]) > 0">
				<xsl:value-of select="normalize-space(@from)"/>
			</xsl:if>
		</xsl:param>
		<xsl:param name="to-year">
			<xsl:if test="count(self::r:duration[@to]) > 0">
				<xsl:value-of select="normalize-space(@to)"/>
			</xsl:if>
		</xsl:param>
		<xsl:param name="weight">
			<xsl:if test="count(self::r:duration[@weight]) > 0">
				<xsl:value-of select="number(normalize-space(@weight))"/>
			</xsl:if>
		</xsl:param>
		<xsl:variable name="start-date">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="string-length(normalize-space($from-year)) > 0">
							<xsl:value-of select="normalize-space($from-year)"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:when test="string-length(/r:resume/@last-modified) > 0">
							<xsl:value-of select="/r:resume/@last-modified"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="end-date">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="string-length(normalize-space($to-year)) > 0">
							<xsl:value-of select="normalize-space($to-year)"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:when test="string-length(/r:resume/@last-modified) > 0">
							<xsl:value-of select="/r:resume/@last-modified"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>

		<xsl:variable name="start-year">
			<xsl:call-template name="date-format">
				<xsl:with-param name="format">
					<xsl:value-of select="'yyyy'"/>
				</xsl:with-param>
				<xsl:with-param name="date" select="$start-date"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="end-year">
			<xsl:call-template name="date-format">
				<xsl:with-param name="format">
					<xsl:value-of select="'yyyy'"/>
				</xsl:with-param>
				<xsl:with-param name="date" select="$end-date"/>
			</xsl:call-template>
		</xsl:variable>

		<xsl:variable name="duration-weight">
			<xsl:choose>
				<xsl:when test="number($weight) = number($weight)">
					<xsl:value-of select="number($weight)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="1"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="duration">
			<xsl:choose>
				<xsl:when test="((number($end-year) - number($start-year)) * $duration-weight) = 0">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="((number($end-year) - number($start-year)) * $duration-weight)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:choose>
			<xsl:when test="string-length($start-year) > 0 and string-length($end-year) > 0">
				<xsl:choose>
					<xsl:when test="count(self::r:duration) > 0">
						<xsl:element name="time">
							<xsl:attribute name="datetime">
								<xsl:text>P</xsl:text>
								<xsl:value-of select="concat($duration, 'Y')"/>
							</xsl:attribute>
							<xsl:attribute name="title">
								<xsl:choose>
									<xsl:when test="string-length(normalize-space($to-year)) > 0">
										<xsl:value-of select="concat($from-year, ' - ', $to-year)"/>
									</xsl:when>
									<xsl:otherwise>
										<xsl:value-of select="concat('Since ', $start-year)"/>
									</xsl:otherwise>
								</xsl:choose>
							</xsl:attribute>
							<xsl:attribute name="tabindex">
								<xsl:value-of select="0"/>
							</xsl:attribute>
							<xsl:value-of select="concat($duration, ' ', normalize-space(@unit))"/>
							<xsl:if test="not(number($duration) = 1)">
								<xsl:text>s</xsl:text>
							</xsl:if>
						</xsl:element>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$duration"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="normalize-space(text())"/>
				<xsl:message>
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using fallback value: </xsl:text>
					<xsl:value-of select="concat('&quot;', normalize-space(text()), '&quot;')"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<!--<xsl:template name="duration" match="r:duration" mode="html">
		<xsl:variable name="from-year">
			<xsl:choose>
				<xsl:when test="count(self::r:duration[@from]) > 0">
					<xsl:call-template name="date-eval">
						<xsl:with-param name="truncate-to" select="'year'"/>
						<xsl:with-param name="date" select="@from"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="to-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="count(self::r:duration[@to]) > 0">
							<xsl:value-of select="@to"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="duration">
			<xsl:choose>
				<xsl:when test="(number($to-year) - number($from-year)) = 0">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="(number($to-year) - number($from-year))"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="string-length($from-year) > 0 and string-length($to-year) > 0">
				<xsl:element name="time">
					<xsl:attribute name="datetime">
						<xsl:text>P</xsl:text>
						<xsl:value-of select="concat($duration, 'Y')"/>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:value-of select="concat('Since ', $from-year)"/>
					</xsl:attribute>
					<xsl:value-of select="concat(' ', $duration, ' ', normalize-space(@unit), ' ')"/>
				</xsl:element>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using </xsl:text>
					<xsl:value-of select="concat('(', $to-year, ' - ', $from-year, ')')"/>
				</xsl:message>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat(' ', normalize-space(text()), ' ')"/>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using fallback value: </xsl:text>
					<xsl:value-of select="concat('&quot;', normalize-space(text()), '&quot;')"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>-->

	<xsl:template match="@*" mode="html">
		<xsl:attribute name="{local-name()}">
			<xsl:value-of select="."/>
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="handle-text">
		<xsl:param name="text" select="''"/>
		<xsl:choose>
			<xsl:when test="string-length($text) > 0 and string-length(normalize-space($text)) = 0">
				<xsl:text> </xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="date-eval" match="r:start-date | r:end-date">
		<xsl:param name="date" select="."/>
		<xsl:param name="format" select="@format"/>
		<xsl:param name="symbolic">
			<xsl:choose>
				<xsl:when test="$date = 'now' or $date = 'present'">
					<xsl:value-of select="'present'"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="false()"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:param>
		<xsl:param name="truncate-to" select="''"/>
		<xsl:variable name="value" select="normalize-space($date)"/>
		<xsl:choose>
			<xsl:when test="$symbolic = 'present'">
				<xsl:text>Present</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="truncated-date">
					<xsl:choose>
						<xsl:when test="$truncate-to = 'year'">
							<xsl:call-template name="date-format">
								<xsl:with-param name="date">
									<xsl:value-of select="$value"/>
								</xsl:with-param>
								<xsl:with-param name="format" select="'yyyy'"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'month'">
							<xsl:call-template name="date-format">
								<xsl:with-param name="date">
									<xsl:value-of select="$value"/>
								</xsl:with-param>
								<xsl:with-param name="format" select="'yyyy-MM'"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'day'">
							<xsl:call-template name="date-format">
								<xsl:with-param name="date">
									<xsl:value-of select="$value"/>
								</xsl:with-param>
								<xsl:with-param name="format" select="'yyyy-MM-dd'"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'hour'">
							<xsl:call-template name="date-format">
								<xsl:with-param name="date">
									<xsl:value-of select="$value"/>
								</xsl:with-param>
								<xsl:with-param name="format" select="concat('yyyy-MM-dd', &quot;'T'&quot;, 'HH:mm:ss')"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'minute'">
							<xsl:call-template name="date-format">
								<xsl:with-param name="date">
									<xsl:value-of select="$value"/>
								</xsl:with-param>
								<xsl:with-param name="format" select="concat('yyyy-MM-dd', &quot;'T'&quot;, 'HH:mm:ss')"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'second'">
							<xsl:call-template name="date-format">
								<xsl:with-param name="date">
									<xsl:value-of select="$value"/>
								</xsl:with-param>
								<xsl:with-param name="format" select="concat('yyyy-MM-dd', &quot;'T'&quot;, 'HH:mm:ss')"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$value"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:choose>
					<xsl:when test="string-length($format) > 0">
						<xsl:call-template name="date-format">
							<xsl:with-param name="date" select="$truncated-date"/>
							<xsl:with-param name="format" select="$format"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$truncated-date"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="date-format">
		<xsl:param name="date" select="."/>
		<xsl:param name="format" select="'M/d/yyyy'"/>
		<xsl:variable name="value" select="normalize-space($date)"/>
		<xsl:variable name="year-test">
			<xsl:call-template name="grab-until">
				<xsl:with-param name="text">
					<xsl:value-of select="$value"/>
				</xsl:with-param>
				<xsl:with-param name="token" select="'-'"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="month-test">
			<xsl:call-template name="grab-until">
				<xsl:with-param name="text">
					<xsl:value-of select="$value"/>
				</xsl:with-param>
				<xsl:with-param name="token" select="'-'"/>
				<xsl:with-param name="skip-count" select="1"/>
				<xsl:with-param name="include-skipped" select="false()"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="day-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text">
							<xsl:value-of select="substring-before($value, 'T')"/>
						</xsl:with-param>
						<xsl:with-param name="token" select="'-'"/>
						<xsl:with-param name="skip-count" select="2"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text">
							<xsl:value-of select="$value"/>
						</xsl:with-param>
						<xsl:with-param name="token" select="'-'"/>
						<xsl:with-param name="skip-count" select="2"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="hour-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text">
							<xsl:value-of select="substring-after($value, 'T')"/>
						</xsl:with-param>
						<xsl:with-param name="token" select="':'"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="minute-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text">
							<xsl:value-of select="substring-after($value, 'T')"/>
						</xsl:with-param>
						<xsl:with-param name="token" select="':'"/>
						<xsl:with-param name="skip-count" select="1"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="second-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text">
							<xsl:value-of select="substring-after($value, 'T')"/>
						</xsl:with-param>
						<xsl:with-param name="token" select="':'"/>
						<xsl:with-param name="skip-count" select="2"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="year">
			<xsl:value-of select="number($year-test)"/>
		</xsl:variable>
		<xsl:variable name="month">
			<xsl:choose>
				<xsl:when test="string-length($month-test) > 0">
					<xsl:value-of select="number($month-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="1"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="day">
			<xsl:choose>
				<xsl:when test="string-length($day-test) > 0">
					<xsl:value-of select="number($day-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="1"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="hour">
			<xsl:choose>
				<xsl:when test="string-length($hour-test) > 0">
					<xsl:value-of select="number($hour-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="0"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="minute">
			<xsl:choose>
				<xsl:when test="string-length($minute-test) > 0">
					<xsl:value-of select="number($minute-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="0"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="second">
			<xsl:choose>
				<xsl:when test="string-length($second-test) > 0">
					<xsl:value-of select="number($second-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="0"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:call-template name="eval-date-format">
			<xsl:with-param name="date-year" select="$year"/>
			<xsl:with-param name="date-month" select="$month"/>
			<xsl:with-param name="date-day" select="$day"/>
			<xsl:with-param name="date-hour" select="$hour"/>
			<xsl:with-param name="date-minute" select="$minute"/>
			<xsl:with-param name="date-second" select="$second"/>
			<xsl:with-param name="format" select="$format"/>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="eval-date-format">
		<xsl:param name="date-year" select="''"/>
		<xsl:param name="date-month" select="''"/>
		<xsl:param name="date-day" select="''"/>
		<xsl:param name="date-hour" select="''"/>
		<xsl:param name="date-minute" select="''"/>
		<xsl:param name="date-second" select="''"/>
		<xsl:param name="format" select="''"/>
		<xsl:param name="position" select="1"/>
		<xsl:choose>
			<xsl:when test="substring($format, $position, 1) = &quot;'&quot;">
				<xsl:variable name="literal">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text">
							<xsl:value-of select="substring($format, $position + 1)"/>
						</xsl:with-param>
						<xsl:with-param name="token" select="&quot;'&quot;"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:value-of select="$literal"/>
				<xsl:call-template name="eval-date-format">
					<xsl:with-param name="date-year" select="$date-year"/>
					<xsl:with-param name="date-month" select="$date-month"/>
					<xsl:with-param name="date-day" select="$date-day"/>
					<xsl:with-param name="date-hour" select="$date-hour"/>
					<xsl:with-param name="date-minute" select="$date-minute"/>
					<xsl:with-param name="date-second" select="$date-second"/>
					<xsl:with-param name="format" select="$format"/>
					<xsl:with-param name="position" select="$position + string-length($literal) + 2"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$position &lt;= string-length($format)">
				<xsl:variable name="mask">
					<xsl:call-template name="grab-same">
						<xsl:with-param name="text">
							<xsl:value-of select="$format"/>
						</xsl:with-param>
						<xsl:with-param name="position" select="$position"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:variable name="token" select="substring($mask, 1, 1)"/>
				<xsl:variable name="date-part">
					<xsl:choose>
						<xsl:when test="$token = 'y'">
							<xsl:value-of select="$date-year"/>
						</xsl:when>
						<xsl:when test="$token = 'M'">
							<xsl:value-of select="$date-month"/>
						</xsl:when>
						<xsl:when test="$token = 'd'">
							<xsl:value-of select="$date-day"/>
						</xsl:when>
						<xsl:when test="$token = 'H'">
							<xsl:value-of select="$date-hour"/>
						</xsl:when>
						<xsl:when test="$token = 'h'">
							<xsl:choose>
								<xsl:when test="$date-hour = 0">
									<xsl:value-of select="12"/>
								</xsl:when>
								<xsl:when test="$date-hour > 12">
									<xsl:value-of select="$date-hour - 12"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$date-hour"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:when test="$token = 'm'">
							<xsl:value-of select="$date-minute"/>
						</xsl:when>
						<xsl:when test="$token = 's'">
							<xsl:value-of select="$date-second"/>
						</xsl:when>
						<xsl:when test="$token = 'a'">
							<xsl:choose>
								<xsl:when test="$date-hour &lt; 12">
									<xsl:value-of select="'AM'"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="'PM'"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
					</xsl:choose>
				</xsl:variable>

				<xsl:variable name="modifier">
					<xsl:choose>
						<xsl:when test="substring($format, $position + string-length($mask), 1) = '{'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text">
									<xsl:value-of select="substring($format, $position + string-length($mask))"/>
								</xsl:with-param>
								<xsl:with-param name="token" select="'}'"/>
							</xsl:call-template>
							<xsl:value-of select="'}'"/>
						</xsl:when>
					</xsl:choose>
				</xsl:variable>

				<xsl:choose>
					<xsl:when test="string-length(translate($token, 'yMdHhmsa', '')) = 0">
						<xsl:variable name="format-date-part-result">
							<xsl:call-template name="format-date-part">
								<xsl:with-param name="date-part" select="$date-part"/>
								<xsl:with-param name="format" select="$mask"/>
							</xsl:call-template>
						</xsl:variable>
						<xsl:variable name="final-result">
							<xsl:choose>
								<xsl:when test="string-length($modifier) > 0">
									<xsl:call-template name="eval-modifier">
										<xsl:with-param name="input" select="$format-date-part-result"/>
										<xsl:with-param name="modifier" select="$modifier"/>
									</xsl:call-template>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$format-date-part-result"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:variable>
						<xsl:value-of select="$final-result"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$mask"/>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:call-template name="eval-date-format">
					<xsl:with-param name="date-year" select="$date-year"/>
					<xsl:with-param name="date-month" select="$date-month"/>
					<xsl:with-param name="date-day" select="$date-day"/>
					<xsl:with-param name="date-hour" select="$date-hour"/>
					<xsl:with-param name="date-minute" select="$date-minute"/>
					<xsl:with-param name="date-second" select="$date-second"/>
					<xsl:with-param name="format" select="$format"/>
					<xsl:with-param name="position" select="$position + string-length($mask) + string-length($modifier)"/>
				</xsl:call-template>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="eval-modifier">
		<xsl:param name="input" select="''"/>
		<xsl:param name="modifier" select="''"/>
		<xsl:choose>
			<xsl:when test="$modifier = '{st}' or $modifier = '{nd}' or $modifier = '{rd}' or $modifier = '{th}'">
				<xsl:variable name="last-digit" select="number(substring($input, string-length($input)))"/>
				<xsl:variable name="last-two-digits">
					<xsl:choose>
						<xsl:when test="string-length($input) > 1">
							<xsl:value-of select="number(substring($input, string-length($input) - 1))"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$last-digit"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:value-of select="$input"/>
				<xsl:choose>
					<xsl:when test="$last-two-digits > 10 and $last-two-digits &lt; 20">
						<xsl:value-of select="'th'"/>
					</xsl:when>
					<xsl:when test="$last-digit = 1">
						<xsl:value-of select="'st'"/>
					</xsl:when>
					<xsl:when test="$last-digit = 2">
						<xsl:value-of select="'nd'"/>
					</xsl:when>
					<xsl:when test="$last-digit = 3">
						<xsl:value-of select="'rd'"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="'th'"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$modifier = '{upper}' or $modifier = '{uppercase}'">
				<xsl:value-of select="translate($input, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
			</xsl:when>
			<xsl:when test="$modifier = '{lower}' or $modifier = '{lowercase}'">
				<xsl:value-of select="translate($input, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')"/>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="format-date-part">
		<xsl:param name="date-part" select="''"/>
		<xsl:param name="format" select="''"/>
		<xsl:variable name="value" select="number(normalize-space($date-part))"/>
		<xsl:variable name="token" select="substring($format, 1, 1)"/>
		<xsl:choose>
			<xsl:when test="$token = 'y'">
				<xsl:choose>
					<xsl:when test="string-length($format) &lt; 4">
						<xsl:value-of select="substring($value, string-length($value) - string-length($format) + 1)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="zero-pad">
							<xsl:with-param name="value">
								<xsl:value-of select="$value"/>
							</xsl:with-param>
							<xsl:with-param name="size" select="string-length($format)"/>
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$token = 'M'">
				<xsl:variable name="value-name">
					<xsl:call-template name="get-month-name">
						<xsl:with-param name="value">
							<xsl:value-of select="$value"/>
						</xsl:with-param>
					</xsl:call-template>
				</xsl:variable>
				<xsl:choose>
					<xsl:when test="string-length($format) &lt; 3">
						<xsl:call-template name="zero-pad">
							<xsl:with-param name="value">
								<xsl:value-of select="$value"/>
							</xsl:with-param>
							<xsl:with-param name="size" select="string-length($format)"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="string-length($format) = 3">
						<xsl:value-of select="substring($value-name, 1, string-length($format))"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$value-name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$token = 'd'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value">
						<xsl:value-of select="$value"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 'H'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value">
						<xsl:value-of select="$value"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 'h'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value">
						<xsl:value-of select="$value"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 'm'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value">
						<xsl:value-of select="$value"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 's'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value">
						<xsl:value-of select="$value"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$date-part"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="get-month-name">
		<xsl:param name="value" select="."/>
		<xsl:variable name="month" select="number(normalize-space($value))"/>
		<xsl:choose>
			<xsl:when test="$month = 1">
				<xsl:value-of select="'January'"/>
			</xsl:when>
			<xsl:when test="$month = 2">
				<xsl:value-of select="'February'"/>
			</xsl:when>
			<xsl:when test="$month = 3">
				<xsl:value-of select="'March'"/>
			</xsl:when>
			<xsl:when test="$month = 4">
				<xsl:value-of select="'April'"/>
			</xsl:when>
			<xsl:when test="$month = 5">
				<xsl:value-of select="'May'"/>
			</xsl:when>
			<xsl:when test="$month = 6">
				<xsl:value-of select="'June'"/>
			</xsl:when>
			<xsl:when test="$month = 7">
				<xsl:value-of select="'July'"/>
			</xsl:when>
			<xsl:when test="$month = 8">
				<xsl:value-of select="'August'"/>
			</xsl:when>
			<xsl:when test="$month = 9">
				<xsl:value-of select="'September'"/>
			</xsl:when>
			<xsl:when test="$month = 10">
				<xsl:value-of select="'October'"/>
			</xsl:when>
			<xsl:when test="$month = 11">
				<xsl:value-of select="'November'"/>
			</xsl:when>
			<xsl:when test="$month = 12">
				<xsl:value-of select="'December'"/>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="zero-pad">
		<xsl:param name="value" select="."/>
		<xsl:param name="size" select="2"/>
		<xsl:variable name="number" select="number(normalize-space($value))"/>
		<xsl:call-template name="pad-left">
			<xsl:with-param name="char" select="'0'"/>
			<xsl:with-param name="value">
				<xsl:value-of select="$number"/>
			</xsl:with-param>
			<xsl:with-param name="size" select="$size"/>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="pad-left">
		<xsl:param name="value" select="."/>
		<xsl:param name="char" select="' '"/>
		<xsl:param name="size" select="0"/>
		<xsl:choose>
			<xsl:when test="string-length($value) &lt; $size">
				<xsl:call-template name="pad-left">
					<xsl:with-param name="char" select="$char"/>
					<xsl:with-param name="value">
						<xsl:value-of select="concat($char, $value)"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="$size"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$value"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="pad-right">
		<xsl:param name="value" select="."/>
		<xsl:param name="char" select="' '"/>
		<xsl:param name="size" select="0"/>
		<xsl:choose>
			<xsl:when test="string-length($value) &lt; $size">
				<xsl:call-template name="pad-right">
					<xsl:with-param name="char" select="$char"/>
					<xsl:with-param name="value">
						<xsl:value-of select="concat($value, $char)"/>
					</xsl:with-param>
					<xsl:with-param name="size" select="$size"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$value"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="grab-same">
		<xsl:param name="text" select="."/>
		<xsl:param name="position" select="1"/>
		<xsl:param name="output" select="''"/>
		<xsl:variable name="char" select="substring($text, $position, 1)"/>
		<xsl:choose>
			<xsl:when test="$position &lt;= string-length($text)">
				<xsl:choose>
					<xsl:when test="string-length($output) > 0">
						<xsl:choose>
							<xsl:when test="substring($output, 1, 1) = $char">
								<xsl:call-template name="grab-same">
									<xsl:with-param name="text" select="$text"/>
									<xsl:with-param name="position" select="$position + 1"/>
									<xsl:with-param name="output" select="concat($output, $char)"/>
								</xsl:call-template>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="$output"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="grab-same">
							<xsl:with-param name="text" select="$text"/>
							<xsl:with-param name="position" select="$position + 1"/>
							<xsl:with-param name="output" select="$char"/>
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$output"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="grab-until">
		<xsl:param name="text" select="."/>
		<xsl:param name="token" select="','"/>
		<xsl:param name="skip-count" select="0"/>
		<xsl:param name="index" select="0"/>
		<xsl:param name="include-skipped" select="true()"/>
		<xsl:choose>
			<xsl:when test="$index = $skip-count">
				<xsl:choose>
					<xsl:when test="contains($text, $token)">
						<xsl:value-of select="substring-before($text, $token)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$text"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$index > $skip-count"/>
			<xsl:otherwise>
				<xsl:if test="boolean($include-skipped)">
					<xsl:choose>
						<xsl:when test="contains($text, $token)">
							<xsl:value-of select="substring-before($text, $token)"/>
							<xsl:value-of select="$token"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$text"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
				<xsl:call-template name="grab-until">
					<xsl:with-param name="text">
						<xsl:value-of select="substring-after($text, $token)"/>
					</xsl:with-param>
					<xsl:with-param name="token" select="$token"/>
					<xsl:with-param name="skip-count" select="$skip-count"/>
					<xsl:with-param name="index" select="$index + 1"/>
					<xsl:with-param name="include-skipped" select="$include-skipped"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="skill-ref" match="r:skill" mode="html">
		<xsl:param name="skill-ref" select="."/>
		<xsl:param name="use-original-text" select="false()"/>
		<xsl:variable name="skill-name">
			<xsl:choose>
				<xsl:when test="count($skill-ref/self::*[@name]) > 0">
					<xsl:value-of select="normalize-space($skill-ref/@name)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="normalize-space($skill-ref)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="ref-name" select="translate(normalize-space($skill-name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-')"/>
		<xsl:variable name="ref" select="/r:resume/r:skills/r:skill[translate(normalize-space(r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = $ref-name]"/>
		<xsl:variable name="skill-text">
			<xsl:choose>
				<xsl:when test="$use-original-text or (count($skill-ref/self::*[@name]) = 0 and translate(normalize-space($ref/r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = $ref-name)">
					<xsl:value-of select="normalize-space($ref/r:name)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="normalize-space($skill-ref)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="count($ref) > 0">
				<xsl:call-template name="list-skill">
					<xsl:with-param name="skill" select="$ref"/>
					<xsl:with-param name="skill-text">
						<xsl:value-of select="$skill-text"/>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:element name="span">
					<xsl:attribute name="class">
						<xsl:text>skill-reference skill-reference-error</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="data-skill-reference">
						<xsl:value-of select="$ref-name"/>
					</xsl:attribute>
					<xsl:value-of select="$skill-text"/>
				</xsl:element>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>