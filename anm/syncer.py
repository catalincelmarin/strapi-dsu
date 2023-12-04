import mysql.connector

# Establish a connection to the MySQL database
src = mysql.connector.connect(
    host='192.168.79.51',
    port='3306',
    user='strapi',
    password='strapi-@sts',
    database='dsu_trans'
)

dst = mysql.connector.connect(
    host='192.168.79.51',
    port='3306',
    user='strapi',
    password='strapi-@sts',
    database='dsu4'
)

# Create a cursor to interact with the database
csrc = src.cursor()
cdst = dst.cursor()

# Execute a SELECT query
query = "select * from up_users WHERE id > 42964;"
csrc.execute(query)
rows = csrc.fetchall()
columns = [column[0] for column in csrc.description]

for row in rows:
    row_data = dict(zip(columns, row))
    query = f"select COUNT(*) from up_users WHERE id={row_data['id']}"
    cdst.execute(query)
    data = cdst.fetchone()
    if data[0] == 0:
        ps = ['%s' for i in row]
        insert_query = f"INSERT INTO up_users ({','.join(columns)}) VALUES ({','.join(ps)})"
        values = row
        cdst.execute(insert_query, values)
        dst.commit()
    else:

        query = f"select user_id,county_id from up_users_judete_links WHERE user_id={row_data['id']};"
        csrc.execute(query)
        rels = csrc.fetchall()
        if len(rels) > 0:
            print("found: " + str(row_data['id']))
            for rel in rels:
                insert_query = f"INSERT INTO up_users_judete_links (user_id,county_id) VALUES (%s,%s)"
                try:
                    cdst.execute(insert_query,rel)
                    dst.commit()
                except Exception as e:
                    print(e)

        query = f"select user_id,alert_id from up_users_alerts_links WHERE user_id={row_data['id']};"
        csrc.execute(query)
        rels = csrc.fetchall()
        if len(rels) > 0:
            print("found: " + str(row_data['id']))
            for rel in rels:
                insert_query = f"INSERT INTO up_users_alerts_links (user_id,alert_id) VALUES (%s,%s)"
                try:
                    cdst.execute(insert_query, rel)
                    dst.commit()
                except Exception as e:
                    print(e)
